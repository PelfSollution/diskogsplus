var Discogs = require("disconnect").Client;
import { getKeyNotation } from "@/lib/musicNotation";
import { sortByHarmonyAndBpm } from "@/lib/mixtapeOrder";
import { durationToSeconds, formatSessionDuration } from "@/lib/vinyl";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { fetchDiscogsRelease } from "@/services/discogs/fetchRelease";
import { enrichTracklistWithAudioFeatures } from "@/services/audioFeatures/getTrackAudioFeatures";
import { createMixtape } from "@/services/supabase/mixtapes";
import addMixtape from "@/services/supabase/addMixtape";

// Cada disco son varias peticiones a Discogs y ReccoBeats: se revisan por tandas
// hasta reunir material suficiente, con un máximo de discos y de tiempo
const RELEASE_BATCH = 6;
const MAX_RELEASES_PER_SESSION = 30;
const TIME_BUDGET_MS = 25_000;
// Rango mínimo: «a 120 BPM» se busca entre 116 y 124
const MIN_BPM_WINDOW = 8;
const MAX_COLLECTION_PAGES = 5;
const PROPOSAL_TTL_MS = 60 * 60 * 1000;
// Si Discogs no trae la duración, se cuenta una pista media
const DEFAULT_TRACK_SECONDS = 5 * 60;

export type SessionTrack = {
  artista: string;
  trackname: string;
  disco_id: string;
  album: string;
  tempo: number | null;
  key: number | null;
  mode: number | null;
  duration: string | null;
  vinyl_position: string | null;
  spotifytrackid: string | null;
  cover_url: string | null;
  /** El BPM se ha doblado o partido por la mitad para entrar en el rango (no se guarda) */
  tempoAjustado?: boolean;
};

export type SessionRequest = {
  durationMinutes?: number;
  bpmMin?: number;
  bpmMax?: number;
  genre?: string;
};

// Última propuesta de cada usuario, para guardarla si la confirma (en memoria)
const proposals = new Map<string, { tracks: SessionTrack[]; expiresAt: number }>();

type CollectionRelease = {
  id: number;
  basic_information: {
    title: string;
    artists?: { name: string }[];
    formats?: { name: string }[];
    genres?: string[];
    styles?: string[];
  };
};

async function getVinylCollection(username: string, accessData: any): Promise<CollectionRelease[]> {
  const collection = new Discogs(accessData).user().collection();
  const releases: CollectionRelease[] = [];
  for (let page = 1; page <= MAX_COLLECTION_PAGES; page++) {
    const data = await collection.getReleases(username, 0, { page, per_page: 100 });
    releases.push(...(data?.releases || []));
    if (page >= (data?.pagination?.pages ?? 0)) break;
  }
  return releases.filter((r) => r.basic_information?.formats?.[0]?.name === "Vinyl");
}

function matchesGenre(release: CollectionRelease, genre?: string): boolean {
  if (!genre) return true;
  const wanted = genre.toLowerCase().split(/[,/]| y | and /).map((g) => g.trim()).filter(Boolean);
  const tags = [...(release.basic_information.genres || []), ...(release.basic_information.styles || [])]
    .map((t) => t.toLowerCase());
  return wanted.some((w) => tags.some((t) => t.includes(w)));
}

/** Copia barajada (Fisher-Yates) para que cada propuesta use discos distintos. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function getReleaseSessionTracks(release: CollectionRelease): Promise<SessionTrack[]> {
  const data = await fetchDiscogsRelease(release.id, null);
  const albumArtist = removeAllSubstringsInParenthesis(
    data?.artists?.[0]?.name || release.basic_information.artists?.[0]?.name || ""
  );
  const album = data?.title || release.basic_information.title;
  const images: any[] = Array.isArray(data?.images) ? data.images : [];
  const cover = (images.find((i) => i.type === "primary") || images[0])?.uri || null;
  const tracklist: { position: string; title: string; duration: string; artist?: string }[] = (
    Array.isArray(data?.tracklist) ? data.tracklist : []
  )
    .filter((t: any) => t.type_ !== "heading" && t.title)
    .map((t: any) => ({
      position: t.position || "",
      title: t.title,
      duration: t.duration || "",
      artist: t.artists?.[0]?.name ? removeAllSubstringsInParenthesis(t.artists[0].name) : undefined,
    }));

  const enriched = await enrichTracklistWithAudioFeatures(tracklist, albumArtist, album);
  return enriched.map((t) => ({
    artista: t.artist || albumArtist,
    trackname: t.title,
    disco_id: String(release.id),
    album,
    tempo: t.tempo ?? null,
    key: t.key ?? null,
    mode: t.mode ?? null,
    duration: t.duration || null,
    vinyl_position: t.position ? t.position.slice(0, 12) : null,
    spotifytrackid: t.spotifyTrackId ?? null,
    cover_url: cover,
  }));
}

function camelotOf(track: SessionTrack): string | null {
  if (track.key == null || track.mode == null) return null;
  const code = getKeyNotation(track.key, track.mode).notation.match(/\((.*?)\)/)?.[1];
  return code && code !== "N/A" ? code : null;
}

/**
 * Propone una sesión con los vinilos de la colección del usuario: filtra por
 * género/estilo, busca BPM y tonalidad, se queda con el rango de BPM, ordena
 * por armonía y BPM y corta en la duración pedida.
 */
export async function buildSession(username: string, accessData: any, request: SessionRequest) {
  if (!accessData?.token || String(accessData.token).startsWith("dev_")) {
    return { error: "Para leer tu colección hace falta iniciar sesión con Discogs." };
  }

  const durationMinutes = Math.min(Math.max(request.durationMinutes || 60, 10), 240);
  let bpmMin = request.bpmMin ?? null;
  let bpmMax = request.bpmMax ?? null;
  // Un rango demasiado estrecho no encuentra nada: se abre alrededor del centro
  if (bpmMin !== null && bpmMax !== null && bpmMax - bpmMin < MIN_BPM_WINDOW) {
    const center = (bpmMin + bpmMax) / 2;
    bpmMin = center - MIN_BPM_WINDOW / 2;
    bpmMax = center + MIN_BPM_WINDOW / 2;
  }
  const hasBpmFilter = bpmMin !== null || bpmMax !== null;
  const inBpmRange = (bpm: number) => (bpmMin === null || bpm >= bpmMin) && (bpmMax === null || bpm <= bpmMax);

  /**
   * BPM de la pista dentro del rango: tal cual, o al doble o la mitad (las
   * bases de datos suelen dar medio tiempo o doble tiempo). null si no encaja.
   */
  const tempoInRange = (tempo: number | null): number | null => {
    if (tempo == null) return null;
    for (const candidate of [tempo, tempo * 2, tempo / 2]) {
      if (inBpmRange(candidate)) return candidate;
    }
    return null;
  };

  let collection: CollectionRelease[];
  try {
    collection = await getVinylCollection(username, accessData);
  } catch (err: any) {
    return { error: `No se pudo leer la colección de Discogs: ${err?.message || err}` };
  }

  const candidates = collection.filter((r) => matchesGenre(r, request.genre));
  if (candidates.length === 0) {
    const genres = new Set(collection.flatMap((r) => [...(r.basic_information.genres || []), ...(r.basic_information.styles || [])]));
    return {
      error: `Ningún vinilo de la colección tiene el género o estilo «${request.genre}».`,
      generosDisponibles: Array.from(genres).sort().slice(0, 40),
    };
  }

  // Discos por tandas hasta tener material para la duración pedida (con margen)
  const pool = shuffle(candidates).slice(0, MAX_RELEASES_PER_SESSION);
  const reviewed: CollectionRelease[] = [];
  const allTracks: SessionTrack[] = [];
  const inRange: SessionTrack[] = [];
  const started = Date.now();
  const enoughSeconds = durationMinutes * 60 * 1.5;
  const inRangeSeconds = () =>
    inRange.reduce((sum, t) => sum + (durationToSeconds(t.duration) ?? DEFAULT_TRACK_SECONDS), 0);

  while (reviewed.length < pool.length && inRangeSeconds() < enoughSeconds && Date.now() - started < TIME_BUDGET_MS) {
    const batch = pool.slice(reviewed.length, reviewed.length + RELEASE_BATCH);
    reviewed.push(...batch);
    const tracks = (await Promise.all(batch.map((r) => getReleaseSessionTracks(r).catch(() => [])))).flat();
    allTracks.push(...tracks);
    for (const t of tracks) {
      if (!hasBpmFilter) {
        inRange.push(t);
        continue;
      }
      const tempo = tempoInRange(t.tempo);
      if (tempo !== null) inRange.push({ ...t, tempo, tempoAjustado: tempo !== t.tempo });
    }
  }

  // Ordenar y cortar al llegar a la duración
  const ordered = sortByHarmonyAndBpm(inRange);
  const session: SessionTrack[] = [];
  let seconds = 0;
  for (const track of ordered) {
    if (seconds >= durationMinutes * 60) break;
    session.push(track);
    seconds += durationToSeconds(track.duration) ?? DEFAULT_TRACK_SECONDS;
  }

  const withBpm = allTracks.filter((t) => t.tempo != null);
  const coverage = {
    discosQueEncajan: candidates.length,
    discosRevisados: reviewed.length,
    pistasRevisadas: allTracks.length,
    pistasConBpm: withBpm.length,
    rangoBuscado: hasBpmFilter ? `${bpmMin !== null ? Math.round(bpmMin) : "?"}–${bpmMax !== null ? Math.round(bpmMax) : "?"} BPM` : "cualquiera",
  };

  if (session.length === 0) {
    // Las más cercanas al rango, para proponer alternativas en vez de nada
    const target = bpmMin !== null && bpmMax !== null ? (bpmMin + bpmMax) / 2 : bpmMin ?? bpmMax ?? 0;
    const closest = [...withBpm]
      .sort((a, b) => Math.abs((a.tempo as number) - target) - Math.abs((b.tempo as number) - target))
      .slice(0, 6)
      .map((t) => ({ artista: t.artista, pista: t.trackname, disco: t.album, bpm: Math.round(t.tempo as number), camelot: camelotOf(t) }));
    return {
      error: "Ninguna pista con BPM conocido cae en ese rango entre los discos revisados.",
      ...coverage,
      motivo:
        "ReccoBeats y Deezer no tienen BPM de muchas ediciones pequeñas; solo se cuentan las pistas con BPM conocido.",
      pistasMasCercanas: closest,
    };
  }

  proposals.set(username, { tracks: session, expiresAt: Date.now() + PROPOSAL_TTL_MS });

  return {
    duracionAproximada: formatSessionDuration(seconds),
    duracionesEstimadas: session.filter((t) => !durationToSeconds(t.duration)).length,
    ...coverage,
    pistas: session.map((t, i) => ({
      orden: i + 1,
      artista: t.artista,
      pista: t.trackname,
      disco: t.album,
      disco_id: t.disco_id,
      posicion_vinilo: t.vinyl_position,
      bpm: t.tempo ? Math.round(t.tempo) : null,
      // Medio tiempo o doble tiempo respecto al BPM de la base de datos
      bpmAjustado: t.tempoAjustado || undefined,
      camelot: camelotOf(t),
      duracion: t.duration,
    })),
    nota: "Propuesta guardada solo en memoria. Para crear la mixtape, pide confirmación al usuario y usa save_session_as_mixtape.",
  };
}

/** Guarda la última propuesta del usuario como mixtape nueva, en el mismo orden. */
export async function saveSessionAsMixtape(username: string, nombre: string) {
  const proposal = proposals.get(username);
  if (!proposal || proposal.expiresAt < Date.now()) {
    return { error: "No hay ninguna sesión propuesta reciente. Primero hay que crearla con build_session." };
  }

  const cleanName = nombre.trim().slice(0, 80);
  if (!cleanName) return { error: "La mixtape necesita un nombre." };

  let mixtape;
  try {
    mixtape = await createMixtape(username, cleanName);
  } catch (err: any) {
    if (err?.code === "23505") return { error: `Ya existe una mixtape llamada «${cleanName}».` };
    return { error: `No se pudo crear la mixtape: ${err?.message || err}` };
  }

  // En serie: addMixtape coloca cada pista al final
  for (const track of proposal.tracks) {
    const { tempoAjustado, ...fields } = track;
    await addMixtape({ ...fields, username, mixtape_id: mixtape.id });
  }
  proposals.delete(username);

  return { mixtape: cleanName, mixtape_id: mixtape.id, pistas: proposal.tracks.length };
}

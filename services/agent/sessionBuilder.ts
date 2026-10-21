var Discogs = require("disconnect").Client;
import { getKeyNotation } from "@/lib/musicNotation";
import { sortByHarmonyAndBpm } from "@/lib/mixtapeOrder";
import { durationToSeconds, formatSessionDuration } from "@/lib/vinyl";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { fetchDiscogsRelease } from "@/services/discogs/fetchRelease";
import { enrichTracklistWithAudioFeatures } from "@/services/audioFeatures/getTrackAudioFeatures";
import { createMixtape } from "@/services/supabase/mixtapes";
import addMixtape from "@/services/supabase/addMixtape";

// Cada disco son varias peticiones a Discogs y ReccoBeats: se limita por propuesta
const MAX_RELEASES_PER_SESSION = 8;
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
  const bpmMin = request.bpmMin ?? null;
  const bpmMax = request.bpmMax ?? null;

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

  const releases = shuffle(candidates).slice(0, MAX_RELEASES_PER_SESSION);
  const perRelease = await Promise.all(releases.map((r) => getReleaseSessionTracks(r).catch(() => [])));
  const allTracks = perRelease.flat();

  const inRange = allTracks.filter((t) => {
    if (bpmMin === null && bpmMax === null) return true;
    if (t.tempo == null) return false;
    return (bpmMin === null || t.tempo >= bpmMin) && (bpmMax === null || t.tempo <= bpmMax);
  });

  // Ordenar y cortar al llegar a la duración
  const ordered = sortByHarmonyAndBpm(inRange);
  const session: SessionTrack[] = [];
  let seconds = 0;
  for (const track of ordered) {
    if (seconds >= durationMinutes * 60) break;
    session.push(track);
    seconds += durationToSeconds(track.duration) ?? DEFAULT_TRACK_SECONDS;
  }

  if (session.length === 0) {
    return {
      error: "No hay pistas con BPM conocido en ese rango entre los discos revisados.",
      discosRevisados: releases.map((r) => r.basic_information.title),
      pistasSinBpm: allTracks.filter((t) => t.tempo == null).length,
    };
  }

  proposals.set(username, { tracks: session, expiresAt: Date.now() + PROPOSAL_TTL_MS });

  return {
    duracionAproximada: formatSessionDuration(seconds),
    duracionesEstimadas: session.filter((t) => !durationToSeconds(t.duration)).length,
    discosRevisados: releases.length,
    discosQueEncajan: candidates.length,
    pistas: session.map((t, i) => ({
      orden: i + 1,
      artista: t.artista,
      pista: t.trackname,
      disco: t.album,
      disco_id: t.disco_id,
      posicion_vinilo: t.vinyl_position,
      bpm: t.tempo ? Math.round(t.tempo) : null,
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
    const { album, ...fields } = track;
    await addMixtape({ ...fields, username, mixtape_id: mixtape.id });
  }
  proposals.delete(username);

  return { mixtape: cleanName, mixtape_id: mixtape.id, pistas: proposal.tracks.length };
}

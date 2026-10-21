import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { getTrackAudioFeatures, normalizeForMatch } from "../audioFeatures/getTrackAudioFeatures";
import { fetchDiscogsRelease } from "../discogs/fetchRelease";

const MAX_TRACKS_PER_RUN = 50;
const CONCURRENCY = 3;

type PendingTrack = {
  id: number;
  artista: string;
  trackname: string;
  disco_id: string;
  tempo: number | null;
  key: number | null;
  mode: number | null;
  spotifytrackid: string | null;
  duration: string | null;
  vinyl_position: string | null;
};

/** Pistas de un release de Discogs (sin cabeceras «Side A»). Una petición por disco. */
async function getReleaseTracks(discoId: string): Promise<{ position: string; title: string; duration: string }[]> {
  try {
    const release = await fetchDiscogsRelease(discoId, null);
    return (Array.isArray(release?.tracklist) ? release.tracklist : [])
      .filter((t: any) => t.type_ !== "heading")
      .map((t: any) => ({ position: t.position || "", title: t.title || "", duration: t.duration || "" }));
  } catch (err: any) {
    console.warn(`[Mixtape] No se pudo leer el disco ${discoId} de Discogs:`, err?.message);
    return [];
  }
}

type ReleaseTrack = Awaited<ReturnType<typeof getReleaseTracks>>[number];

/**
 * Pista del release con el mismo título. Primero el título exacto; si no, sin
 * paréntesis ni acentos, pero solo si no hay duda: «Day Zero» y «Day Zero
 * (Bataille Rework)» quedan iguales al normalizar.
 */
function findReleaseTrack(tracks: ReleaseTrack[], title: string): ReleaseTrack | undefined {
  const exact = title.trim().toLowerCase();
  const sameTitle = tracks.find((t) => t.title.trim().toLowerCase() === exact);
  if (sameTitle) return sameTitle;

  const target = normalizeForMatch(title);
  const candidates = tracks.filter((t) => normalizeForMatch(t.title) === target);
  return candidates.length === 1 ? candidates[0] : undefined;
}

/**
 * Completa las pistas de una mixtape a las que les faltan datos: posición en
 * el vinilo y duración (Discogs), y BPM y tonalidad (ReccoBeats, Deezer).
 * Solo rellena campos vacíos y marca las pistas como revisadas aunque no
 * aparezcan en ningún servicio. Solo servidor.
 */
export async function completeMixtapeTracks(
  username: string,
  mixtapeId: number
): Promise<{ revisadas: number; actualizadas: number }> {
  if (!isSupabaseConfigured) return { revisadas: 0, actualizadas: 0 };

  const { data, error } = await supabase
    .from("mixtape")
    .select("id, artista, trackname, disco_id, tempo, key, mode, spotifytrackid, duration, vinyl_position")
    .eq("username", username)
    .eq("mixtape_id", mixtapeId)
    .or("tempo.is.null,key.is.null,mode.is.null,vinyl_position.is.null")
    .limit(MAX_TRACKS_PER_RUN);

  if (error) throw error;
  const pending = (data || []) as PendingTrack[];

  // Cada disco se pide una vez aunque tenga varias pistas en la mixtape
  const releases = new Map<string, ReturnType<typeof getReleaseTracks>>();
  const releaseTracks = (discoId: string) => {
    if (!releases.has(discoId)) releases.set(discoId, getReleaseTracks(discoId));
    return releases.get(discoId)!;
  };

  let actualizadas = 0;
  let next = 0;
  const checkedAt = new Date().toISOString();

  async function worker() {
    while (next < pending.length) {
      const track = pending[next++];
      const changes: Record<string, number | string> = {};

      if (track.vinyl_position == null || !track.duration) {
        const match = findReleaseTrack(await releaseTracks(track.disco_id), track.trackname);
        if (match?.position && track.vinyl_position == null) changes.vinyl_position = match.position.slice(0, 12);
        if (match?.duration && !track.duration) changes.duration = match.duration;
      }

      if (track.tempo == null || track.key == null || track.mode == null) {
        const features = await getTrackAudioFeatures(track.trackname, track.artista);
        if (features) {
          if (track.tempo == null && features.tempo != null) changes.tempo = features.tempo;
          // Tonalidad y modo van juntos: sin uno de los dos no hay código Camelot
          if ((track.key == null || track.mode == null) && features.key != null && features.mode != null) {
            changes.key = features.key;
            changes.mode = features.mode;
          }
          if (!track.spotifytrackid && features.spotifyTrackId) {
            changes.spotifytrackid = features.spotifyTrackId;
          }
        }
      }

      const found = Object.keys(changes).length > 0;
      const { error: updateError } = await supabase
        .from("mixtape")
        .update({ ...changes, data_checked_at: checkedAt })
        .eq("id", track.id)
        .eq("mixtape_id", mixtapeId);
      if (updateError) throw updateError;
      if (found) actualizadas++;
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
  return { revisadas: pending.length, actualizadas };
}

export default completeMixtapeTracks;

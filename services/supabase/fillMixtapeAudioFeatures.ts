import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { getTrackAudioFeatures } from "../audioFeatures/getTrackAudioFeatures";

const MAX_TRACKS_PER_RUN = 50;
const CONCURRENCY = 3;

/**
 * Busca BPM y tonalidad de las pistas de una mixtape que no los tienen
 * (pistas añadidas antes de ReccoBeats). Solo rellena los campos vacíos.
 * Solo servidor.
 */
export async function fillMixtapeAudioFeatures(
  username: string,
  mixtapeId: number
): Promise<{ revisadas: number; actualizadas: number }> {
  if (!isSupabaseConfigured) return { revisadas: 0, actualizadas: 0 };

  const { data, error } = await supabase
    .from("mixtape")
    .select("id, artista, trackname, tempo, key, mode, spotifytrackid")
    .eq("username", username)
    .eq("mixtape_id", mixtapeId)
    .or("tempo.is.null,key.is.null,mode.is.null")
    .limit(MAX_TRACKS_PER_RUN);

  if (error) throw error;
  const pending = data || [];
  let actualizadas = 0;
  let next = 0;

  async function worker() {
    while (next < pending.length) {
      const track = pending[next++];
      const features = await getTrackAudioFeatures(track.trackname, track.artista);
      if (!features) continue;

      const changes: Record<string, number | string> = {};
      if (track.tempo == null && features.tempo != null) changes.tempo = features.tempo;
      // Tonalidad y modo van juntos: sin uno de los dos no hay código Camelot
      if ((track.key == null || track.mode == null) && features.key != null && features.mode != null) {
        changes.key = features.key;
        changes.mode = features.mode;
      }
      if (!track.spotifytrackid && features.spotifyTrackId) {
        changes.spotifytrackid = features.spotifyTrackId;
      }
      if (Object.keys(changes).length === 0) continue;

      const { error: updateError } = await supabase
        .from("mixtape")
        .update(changes)
        .eq("id", track.id)
        .eq("mixtape_id", mixtapeId);
      if (updateError) throw updateError;
      actualizadas++;
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
  return { revisadas: pending.length, actualizadas };
}

export default fillMixtapeAudioFeatures;

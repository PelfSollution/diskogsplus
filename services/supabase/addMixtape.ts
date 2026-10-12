import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import type { LocalMixtapeTrack } from "../local/mixtapeStorage";

export type Mixtape = LocalMixtapeTrack;

/** Añade una pista al mixtape. Si ya estaba, no hace nada. Solo servidor. */
export async function addMixtape(mixtape: Mixtape) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("mixtape")
    .upsert([mixtape], {
      onConflict: "mixtape_id,disco_id,artista,trackname",
      ignoreDuplicates: true,
    })
    .select();

  if (error) throw error;
  return data;
}

export default addMixtape;

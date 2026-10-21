import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import type { LocalMixtapeTrack } from "../local/mixtapeStorage";

export type Mixtape = LocalMixtapeTrack;

/** Siguiente posición libre: las pistas nuevas van al final de la sesión. */
async function nextPosition(mixtapeId: number): Promise<number> {
  const { data, error } = await supabase
    .from("mixtape")
    .select("position")
    .eq("mixtape_id", mixtapeId)
    .not("position", "is", null)
    .order("position", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.length ? data[0].position + 1 : 0;
}

/** Añade una pista al final de la mixtape. Si ya estaba, no hace nada. Solo servidor. */
export async function addMixtape(mixtape: Mixtape) {
  if (!isSupabaseConfigured) return null;

  const position = mixtape.mixtape_id != null ? await nextPosition(mixtape.mixtape_id) : null;

  const { data, error } = await supabase
    .from("mixtape")
    .upsert([{ ...mixtape, position }], {
      onConflict: "mixtape_id,disco_id,artista,trackname",
      ignoreDuplicates: true,
    })
    .select();

  if (error) throw error;
  return data;
}

export default addMixtape;

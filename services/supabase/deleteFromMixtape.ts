import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/** Elimina una pista de una mixtape del usuario. Solo servidor. */
const deleteFromMixtape = async (
  username: string,
  mixtapeId: number,
  artista: string,
  trackname: string,
  disco_id: string
): Promise<void> => {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from("mixtape")
    .delete()
    .eq("username", username)
    .eq("mixtape_id", mixtapeId)
    .eq("artista", artista)
    .eq("trackname", trackname)
    .eq("disco_id", disco_id);

  if (error) throw error;
};

export default deleteFromMixtape;

import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/** Elimina una pista del mixtape. Solo servidor. */
const deleteFromMixtape = async (
  username: string,
  artista: string,
  trackname: string,
  disco_id: string
): Promise<void> => {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from("mixtape")
    .delete()
    .eq("username", username)
    .eq("artista", artista)
    .eq("trackname", trackname)
    .eq("disco_id", disco_id);

  if (error) throw error;
};

export default deleteFromMixtape;

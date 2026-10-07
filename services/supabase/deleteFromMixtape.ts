import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { removeLocalMixtape } from "../local/mixtapeStorage";

const deleteFromMixtape = async (
  username: string,
  artista: string,
  trackname: string,
  disco_id: string
): Promise<void> => {
  // 1. Eliminar siempre del almacenamiento local
  removeLocalMixtape(username, artista, trackname, disco_id);

  // 2. Si Supabase está configurado, sincronizar borrado
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("mixtape")
        .delete()
        .eq("username", username)
        .eq("artista", artista)
        .eq("trackname", trackname)
        .eq("disco_id", disco_id);

      if (error) {
        console.warn("[Mixtape] Error eliminando en Supabase:", error.message);
      }
    } catch (error) {
      console.warn("[Mixtape] Excepción eliminando de Supabase:", error);
    }
  }
};

export default deleteFromMixtape;

import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { getLocalMixtape } from "../local/mixtapeStorage";

async function getMixtape(username: string) {
  if (!username) return [];

  // 1. Si Supabase está configurado, intentar consultar la base de datos
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("mixtape")
        .select("*")
        .eq("username", username);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("[Mixtape] Supabase no disponible, usando almacenamiento local:", err);
    }
  }

  // 2. Fallback a almacenamiento local del navegador
  return getLocalMixtape(username);
}

export default getMixtape;
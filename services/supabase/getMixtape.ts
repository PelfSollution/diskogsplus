import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/** Pistas del mixtape del usuario. Solo servidor. */
async function getMixtape(username: string): Promise<any[]> {
  if (!isSupabaseConfigured || !username) return [];

  const { data, error } = await supabase
    .from("mixtape")
    .select("*")
    .eq("username", username)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Mixtape] Aviso obteniendo el mixtape:", error.message);
    return [];
  }
  return data || [];
}

export default getMixtape;

import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/**
 * Pistas del usuario: de una mixtape si se indica mixtapeId, o de todas
 * (DiscBOT y exportación a Spotify). Solo servidor.
 */
async function getMixtape(username: string, mixtapeId?: number): Promise<any[]> {
  if (!isSupabaseConfigured || !username) return [];

  let query = supabase.from("mixtape").select("*").eq("username", username);
  if (mixtapeId !== undefined) query = query.eq("mixtape_id", mixtapeId);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.warn("[Mixtape] Aviso obteniendo el mixtape:", error.message);
    return [];
  }
  return data || [];
}

export default getMixtape;

import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export async function getArtistInfoFromSupabase(discoId: string | number): Promise<string | null> {
  if (!isSupabaseConfigured || !discoId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("enriched_artist_info")
      .select("enriched_info")
      .eq("disco_id", discoId.toString());

    if (error) {
      console.warn("[Supabase] Aviso consultando información de artista:", error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data[0].enriched_info;
    }
    return null;
  } catch (err: any) {
    // Si la conexión falla, retornamos null silenciosamente
    return null;
  }
}
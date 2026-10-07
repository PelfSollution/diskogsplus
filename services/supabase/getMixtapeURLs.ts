import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export async function getMixtapeURLs(username: string) {
  if (!isSupabaseConfigured || !username) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("mixtape_urls")
      .select("mixtape_url")
      .eq("username", username);

    if (error) {
      console.warn("Aviso obteniendo mixtape_urls:", error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.warn("Aviso obteniendo mixtape_urls:", err?.message || err);
    return [];
  }
}

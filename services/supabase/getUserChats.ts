import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/** Conversación de DiscBOT del usuario sobre un disco. Solo servidor. */
export async function getChatByAlbumAndArtist(username: string, artista: string, album: string) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("chat_logs")
    .select("*")
    .eq("username", username)
    .eq("artista", artista)
    .eq("album", album)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

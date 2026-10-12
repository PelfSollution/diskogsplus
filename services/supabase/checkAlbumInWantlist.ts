import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/** Indica si el disco está en la wantlist del usuario. Solo servidor. */
export async function isAlbumInWantlist(username: string, disco_id: number) {
  if (!isSupabaseConfigured) return false;

  const { data, error } = await supabase
    .from("wantlist")
    .select("disco_id")
    .eq("username", username)
    .eq("disco_id", disco_id)
    .maybeSingle();

  if (error) {
    console.error("Error comprobando álbum en wantlist:", error);
    return false;
  }
  return data !== null;
}

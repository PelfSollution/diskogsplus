import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export async function getArtistImageFromSupabase(artistName: string): Promise<string | null> {
  if (!isSupabaseConfigured || !artistName) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("generated_images_metadata")
      .select("image_url")
      .eq("artista", artistName);

    if (error) {
      return null;
    }

    if (data && data.length > 0) {
      return data[0].image_url;
    }
    return null;
  } catch (err: any) {
    return null;
  }
}

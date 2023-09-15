import { supabase } from "../../lib/supabase";

export async function getArtistImageFromSupabase(artistName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('generated_images_metadata')
      .select('image_url')
      .eq('artist_name', artistName);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return data[0].image_url;
    } else {
      return null;
    }

  } catch (err) {
    console.error('Error obteniendo imagen del artista desde Supabase:', err);
    return null;
  }
}

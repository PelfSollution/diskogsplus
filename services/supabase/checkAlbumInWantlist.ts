
import { supabase } from "@/lib/supabase";

export async function isAlbumInWantlist(username: string, disco_id: number) {
  try {
    const { data, error } = await supabase
      .from('wantlist')
      .select("disco_id")
      .eq('username', username)
      .eq('disco_id', disco_id)
      .maybeSingle(); 

    if (error) {
      throw error;
    }

    return data !== null;  
  } catch (error) {
    console.error("Error comprobando álbum en wantlist:", error);
    return false;
  }
}


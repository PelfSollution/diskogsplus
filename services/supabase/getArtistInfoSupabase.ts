import { supabase } from "../../lib/supabase";

export async function getArtistInfoFromSupabase(discoId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('enriched_artist_info')
        .select('enriched_info')
        .eq('disco_id', discoId);
  
      if (error) {
        throw error;
      }
  
      if (data && data.length > 0) {
        return data[0].enriched_info;
      } else {
        return null;
      }
  
    } catch (err) {
      console.error('Error obteniendo información enriquecida del artista desde Supabase:', err);
      return null;
    }
  }
  
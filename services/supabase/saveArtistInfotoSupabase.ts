import { supabase } from "../../lib/supabase";
import { getArtistInfoFromSupabase } from "./getArtistInfoSupabase";

export async function saveArtistInfotoSupabase(artista: string, album: string, discoId: string, enrichedInfo: string): Promise<boolean> {
    try {
      const existingInfo = await getArtistInfoFromSupabase(discoId);
  
      if (existingInfo) {
        console.warn(`Ya existe información enriquecida para disco_id: ${discoId}`);
        return false;
      }
  
      const { error } = await supabase
        .from('enriched_artist_info')
        .insert({
          artista,
          album,
          disco_id: discoId,
          enriched_info: enrichedInfo
        });
  
      if (error) {
        throw error;
      }
  
      return true;
  
    } catch (err) {
      console.error('Error guardando información enriquecida en Supabase:', err);
      return false;
    }
  }
  
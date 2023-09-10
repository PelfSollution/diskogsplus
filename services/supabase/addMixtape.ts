import { supabase } from "../../lib/supabase";

type Mixtape = {
  username: string;
  artistname: string;
  trackname: string;
  discogsalbumid: string;
  spotifytrackid?: string | null;
  tempo?: number | null;          
  key?: number | null;          
  mode?: number | null;          
  duration?: string | null;      
};

export async function addMixtape(mixtape: Mixtape) {
  try {
    // Corregir valores que pueden ser interpretados como null
    if (mixtape.key === null) mixtape.key = 0;
    if (mixtape.mode === null) mixtape.mode = 0;

    const { data, error } = await supabase
      .from('mixtape')
      .insert([mixtape]);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error añadiendo mixtape:", error);
    return null;
  }
}


export default addMixtape;
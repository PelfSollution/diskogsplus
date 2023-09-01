import { supabase } from "../../lib/supabase";

type Mixtape = {
  username: string;
  artistname: string;
  trackname: string;
  discogsalbumid: string;
  spotifytrackid?: string | null;
};

export async function addMixtape(mixtape: Mixtape) {
  try {
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

import { supabase } from "../../lib/supabase";

const deleteFromMixtape = async (username: string, artistname: string, trackname: string, discogsalbumid: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('mixtape')
      .delete()
      .eq('username', username)
      .eq('artistname', artistname)
      .eq('trackname', trackname)
      .eq('discogsalbumid', discogsalbumid);

    if (error) {
      throw error;
    }

  } catch (error) {
    console.error("Error eliminando de la mixtape:", error);
  }
}

export default deleteFromMixtape;


import { supabase } from "../../lib/supabase";

const deleteFromMixtape = async (username: string, artista: string, trackname: string, disco_id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('mixtape')
      .delete()
      .eq('username', username)
      .eq('artista', artista)
      .eq('trackname', trackname)
      .eq('disco_id', disco_id);

    if (error) {
      throw error;
    }

  } catch (error) {
    console.error("Error eliminando de la mixtape:", error);
  }
}

export default deleteFromMixtape;

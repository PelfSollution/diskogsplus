import { supabase } from "../../lib/supabase";

export async function getChatByAlbumAndArtist(username: string, artista: string, album: string) {
  try {
    const { data, error } = await supabase
      .from('chat_logs')
      .select('*')
      .eq('username', username)
      .eq('artista', artista)
      .eq('album', album)
      .order('created_at', { ascending: true });
    //  console.log(data);
    if (error) {
      throw error;
    }

    return data || [];

  } catch (err) {
    console.error('Error obteniendo datos de chat_logs:', err);
    throw err;
  }
}

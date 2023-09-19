import getMixtape from './getMixtape';

type Song = {
    id: number;
    username: string;
    disco_id: string;
    spotifytrackid: string | null;
    artista: string;
    trackname: string;
    tempo: number | null; 
    key: number | null; 
    mode: number | null; 
    duration: string | null; 
  };
  

export async function getSongsFromSupabase(username: string): Promise<Song[]> {
  try {
    const data = await getMixtape(username);

    if (!data) {
      throw new Error('Mixtape not found for the given user');
    }


    return data;
  } catch (err) {
    console.error('Error fetching songs from Supabase:', err);
    throw err;
  }
}

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
  

/** Pistas de una mixtape, en el orden de la sesión (o de todas si no se indica). */
export async function getSongsFromSupabase(username: string, mixtapeId?: number): Promise<Song[]> {
  try {
    const data = await getMixtape(username, mixtapeId);

    if (!data) {
      throw new Error('Mixtape not found for the given user');
    }


    return data;
  } catch (err) {
    console.error('Error fetching songs from Supabase:', err);
    throw err;
  }
}

import { supabase } from "../../lib/supabase";

async function getMixtape(username: string) {
  try {
    const { data, error } = await supabase.from('mixtape').select('*').eq('username', username);


    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error obteniendo datos de mixtape:', err);
    throw err;
  }
}

export default getMixtape;
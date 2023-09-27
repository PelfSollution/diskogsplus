import { supabase } from "../../lib/supabase";

export async function deleteApiKey(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ openai_api_key: null })
      .eq('username', username);  

    if (error) {
      throw error;
    }

    return true; 
  } catch (error) {
    console.error("Error eliminando la API Key:", error);
    return false; 
  }
}

export default deleteApiKey;


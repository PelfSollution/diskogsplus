import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/** Borra la clave API guardada del usuario. Solo servidor. */
export async function deleteApiKey(username: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase
    .from("users")
    .update({ openai_api_key: null })
    .eq("username", username);

  if (error) {
    console.error("Error eliminando la API Key:", error);
    return false;
  }
  return true;
}

export default deleteApiKey;

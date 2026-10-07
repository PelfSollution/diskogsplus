import { supabase } from "@/lib/supabase";
import { decrypt } from "@/lib/cryptoUtils";

/**
 * Server-only helper to securely fetch and decrypt a user's OpenAI API key from Supabase.
 * This should NEVER be called from or exposed to the client browser.
 */
export async function getUserApiKey(username: string): Promise<string | null> {
  if (!username) return null;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("openai_api_key")
      .eq("username", username)
      .single();

    if (error || !data || !data.openai_api_key) {
      return null;
    }

    return decrypt(data.openai_api_key);
  } catch (err) {
    console.error("Error retrieving user API key:", err);
    return null;
  }
}

export default getUserApiKey;

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { username } = req.body;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("openai_api_key")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is single row not found
      throw new Error(error.message);
    }

    const hasApiKey = Boolean(data && data.openai_api_key);
    // Security: Only return a boolean indicator, never the decrypted plaintext key!
    return res.status(200).json({ hasApiKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return res.status(500).json({ error: message });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabase";
import { requireSessionUser } from "../../lib/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // El usuario sale siempre de la sesión, nunca del body
  const username = requireSessionUser(req, res);
  if (!username) return;

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
    console.error("Error consultando la clave API:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

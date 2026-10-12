import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { getMixtapeURLs } from "@/services/supabase/getMixtapeURLs";

// GET: playlists de Spotify exportadas por el usuario.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const username = requireSessionUser(req, res);
  if (!username) return;

  return res.status(200).json(await getMixtapeURLs(username));
}

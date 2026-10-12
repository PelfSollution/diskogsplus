import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { getChatLogsUser } from "@/services/supabase/getChatLogsUser";
import { getChatByAlbumAndArtist } from "@/services/supabase/getUserChats";

// GET: discos sobre los que el usuario ha hablado con DiscBOT.
// GET ?artista=&album=: la conversación de ese disco.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const username = requireSessionUser(req, res);
  if (!username) return;

  const { artista, album } = req.query;
  try {
    if (typeof artista === "string" && typeof album === "string") {
      return res.status(200).json(await getChatByAlbumAndArtist(username, artista, album));
    }
    return res.status(200).json(await getChatLogsUser(username));
  } catch (err: any) {
    console.error("Error obteniendo chat_logs:", err?.message || err);
    return res.status(500).json({ error: "Error obteniendo el historial del chat" });
  }
}

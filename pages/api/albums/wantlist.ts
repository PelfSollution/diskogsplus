import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { getWantlistItemsUser } from "@/services/supabase/getWantlistItemsUser";
import { isAlbumInWantlist } from "@/services/supabase/checkAlbumInWantlist";

// GET: wantlist del usuario · GET ?disco_id=: { inWantlist } para un disco.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const username = requireSessionUser(req, res);
  if (!username) return;

  if (req.query.disco_id !== undefined) {
    const disco_id = Number(req.query.disco_id);
    if (!Number.isInteger(disco_id)) {
      return res.status(400).json({ error: "disco_id no válido" });
    }
    return res.status(200).json({ inWantlist: await isAlbumInWantlist(username, disco_id) });
  }

  return res.status(200).json((await getWantlistItemsUser(username)) || []);
}

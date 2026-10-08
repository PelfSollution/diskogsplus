import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { getAlbumPlaylist } from "@/services/youtube/getAlbumPlaylist";

/** GET /api/albums/playlist?disco_id=123 → { playlist: AlbumPlaylist } */
export default async function albumPlaylist(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  // Exige sesión: cada disco nuevo gasta cuota de la API de YouTube
  const username = requireSessionUser(req, res);
  if (!username) return;

  const limit = rateLimit(`playlist:${username}`, 30, 60_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({ error: "Demasiadas peticiones. Espera un momento." });
  }

  const discoId = typeof req.query.disco_id === "string" ? req.query.disco_id : "";
  if (!/^\d+$/.test(discoId)) {
    return res.status(400).json({ error: "Parámetro disco_id obligatorio." });
  }

  try {
    const playlist = await getAlbumPlaylist(discoId);
    return res.status(200).json({ playlist });
  } catch (err: any) {
    console.error("[Playlist] Error montando la lista del disco:", err?.message);
    return res.status(502).json({ error: "No se pudo obtener el disco de Discogs." });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { findTrackVideo } from "@/services/youtube/findTrackVideo";

/** GET /api/mixtape/video?disco_id=123&track=Nombre → { video: { videoId, title } | null } */
export default async function mixtapeVideo(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const username = requireSessionUser(req, res);
  if (!username) return;

  const limit = rateLimit(`video:${username}`, 60, 60_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({ error: "Demasiadas peticiones. Espera un momento." });
  }

  const discoId = typeof req.query.disco_id === "string" ? req.query.disco_id : "";
  const track = typeof req.query.track === "string" ? req.query.track : "";
  if (!/^\d+$/.test(discoId) || !track) {
    return res.status(400).json({ error: "Parámetros disco_id y track obligatorios." });
  }

  const video = await findTrackVideo(discoId, track);
  return res.status(200).json({ video });
}

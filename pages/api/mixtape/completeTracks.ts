import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { isSupabaseConfigured } from "@/lib/supabase";
import { userOwnsMixtape } from "@/services/supabase/mixtapes";
import completeMixtapeTracks from "@/services/supabase/completeMixtapeTracks";

/**
 * POST /api/mixtape/completeTracks { mixtape_id } → { revisadas, actualizadas }
 * Rellena posición en el vinilo, duración, BPM y tonalidad de las pistas que no los tienen.
 */
export default async function mixtapeCompleteTracks(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const username = requireSessionUser(req, res);
  if (!username) return;

  if (!isSupabaseConfigured) {
    return res.status(503).json({ error_code: "supabase_not_configured" });
  }

  // Cada pista son varias peticiones a Discogs, ReccoBeats y Deezer
  const limit = rateLimit(`completeTracks:${username}`, 5, 60_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({ error: "Demasiadas peticiones. Espera un momento." });
  }

  const mixtapeId = Number(req.body?.mixtape_id);
  if (!Number.isInteger(mixtapeId)) {
    return res.status(400).json({ error: "mixtape_id no válido" });
  }

  try {
    if (!(await userOwnsMixtape(username, mixtapeId))) {
      return res.status(404).json({ error: "Mixtape no encontrada" });
    }
    return res.status(200).json(await completeMixtapeTracks(username, mixtapeId));
  } catch (err: any) {
    console.error("[Mixtape] Error completando los datos de las pistas:", err?.message || err);
    return res.status(500).json({ error: "Error completando los datos de las pistas" });
  }
}

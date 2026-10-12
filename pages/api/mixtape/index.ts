import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import getMixtape from "@/services/supabase/getMixtape";
import addMixtape from "@/services/supabase/addMixtape";
import deleteFromMixtape from "@/services/supabase/deleteFromMixtape";

/** Número finito o null (evita que "" o undefined se guarden como 0 = Do menor). */
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

// GET: pistas del mixtape · POST: añadir pista · DELETE: quitar pista.
// El usuario sale siempre de la sesión, nunca del body.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = requireSessionUser(req, res);
  if (!username) return;

  // Sin Supabase el cliente usa solo localStorage
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error_code: "supabase_not_configured" });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json(await getMixtape(username));
    }

    const artista = requiredString(req.body?.artista);
    const trackname = requiredString(req.body?.trackname);
    const disco_id = requiredString(String(req.body?.disco_id ?? ""));
    if (!artista || !trackname || !disco_id) {
      return res.status(400).json({ error: "Faltan artista, trackname o disco_id" });
    }

    if (req.method === "POST") {
      const { spotifytrackid, tempo, key, mode, duration } = req.body;
      await addMixtape({
        username,
        artista,
        trackname,
        disco_id,
        spotifytrackid: requiredString(spotifytrackid),
        tempo: toNumberOrNull(tempo),
        key: toNumberOrNull(key),
        mode: toNumberOrNull(mode),
        duration: requiredString(duration),
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      await deleteFromMixtape(username, artista, trackname, disco_id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    console.error("[Mixtape] Error en Supabase:", err?.message || err);
    return res.status(500).json({ error: "Error guardando el mixtape" });
  }
}

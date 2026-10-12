import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listMixtapes,
  createMixtape,
  renameMixtape,
  deleteMixtape,
} from "@/services/supabase/mixtapes";

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const nombre = value.trim().replace(/\s+/g, " ");
  return nombre.length >= 1 && nombre.length <= 80 ? nombre : null;
}

// GET: mixtapes del usuario · POST { nombre }: crear · PATCH { id, nombre }: renombrar
// · DELETE { id }: borrar con sus pistas. El usuario sale siempre de la sesión.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = requireSessionUser(req, res);
  if (!username) return;

  // Sin Supabase solo existe la lista local del navegador
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error_code: "supabase_not_configured" });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json(await listMixtapes(username));
    }

    if (req.method === "POST") {
      const nombre = cleanName(req.body?.nombre);
      if (!nombre) return res.status(400).json({ error: "El nombre debe tener entre 1 y 80 caracteres" });
      return res.status(201).json(await createMixtape(username, nombre));
    }

    const id = Number(req.body?.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id no válido" });
    }

    if (req.method === "PATCH") {
      const nombre = cleanName(req.body?.nombre);
      if (!nombre) return res.status(400).json({ error: "El nombre debe tener entre 1 y 80 caracteres" });
      await renameMixtape(username, id, nombre);
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      await deleteMixtape(username, id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Ya tienes una mixtape con ese nombre" });
    }
    console.error("[Mixtapes] Error en Supabase:", err?.message || err);
    return res.status(500).json({ error: "Error guardando la mixtape" });
  }
}

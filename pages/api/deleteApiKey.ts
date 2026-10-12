import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionUser } from "@/lib/session";
import { deleteApiKey } from "@/services/supabase/deleteApiKey";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // El usuario sale siempre de la sesión, nunca del body
  const username = requireSessionUser(req, res);
  if (!username) return;

  if (!(await deleteApiKey(username))) {
    return res.status(500).json({ error: "No se pudo eliminar la clave API" });
  }
  return res.status(200).json({ success: true });
}

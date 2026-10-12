import type { NextApiRequest, NextApiResponse } from "next";
import { getArtistImageFromSupabase } from "@/services/supabase/getArtistImageFromSupabase";

// GET ?artista=: portada generada por IA para el artista (caché pública).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const artista = typeof req.query.artista === "string" ? req.query.artista : "";
  if (!artista) {
    return res.status(400).json({ error: "Falta artista" });
  }

  return res.status(200).json({ imageUrl: await getArtistImageFromSupabase(artista) });
}

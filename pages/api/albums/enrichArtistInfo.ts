import { NextApiRequest, NextApiResponse } from "next";
import { enrichArtistInfoWithChatGPT } from "@/services/openai/enrichArtistInfo";
import { requireSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";

const enrichArtistInfoHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  // El usuario sale siempre de la sesión, nunca del body
  const username = requireSessionUser(req, res);
  if (!username) return;

  const limit = rateLimit(`enrich:${username}`, 20, 60_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({ error: "Demasiadas peticiones. Espera un momento." });
  }

  const { artistName, albumName, discoId } = req.body;

  try {
    const enrichedInfo = await enrichArtistInfoWithChatGPT(
      artistName || "Artista",
      albumName || "Álbum",
      discoId || "",
      username
    );

    return res.status(200).json({
      info: enrichedInfo,
      enrichedInfo,
    });
  } catch (error: any) {
    console.error("Error en enrichArtistInfoHandler:", error);
    return res.status(500).json({
      error: "Error al enriquecer la información del artista.",
    });
  }
};

export default enrichArtistInfoHandler;

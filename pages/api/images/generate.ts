import { NextApiRequest, NextApiResponse } from "next";
import { fetchOrGenerateImage } from "../../../services/supabase/imageService";
import { requireSessionUser } from "../../../lib/session";
import { rateLimit } from "../../../lib/rateLimit";

const handleImageGeneration = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Utiliza POST." });
  }

  // El usuario sale siempre de la sesión, nunca del body
  const username = requireSessionUser(req, res);
  if (!username) return;

  const limit = rateLimit(`images:${username}`, 10, 60_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({ error: "Demasiadas peticiones. Espera un momento." });
  }

  try {
    const { artistName, coverType, title } = req.body;

    const safeArtist = artistName || "Artista";
    const safeTitle = title || "Álbum";
    const safeCoverType: "front" | "back" = coverType === "back" ? "back" : "front";

    const imageUrl = await fetchOrGenerateImage(
      safeArtist,
      safeCoverType,
      safeTitle,
      username
    );

    if (imageUrl) {
      return res.status(200).json({ imageUrl });
    }

    return res.status(500).json({ error: "No se pudo generar la portada con los motores de IA disponibles." });
  } catch (error: any) {
    console.error("Error en handleImageGeneration:", error);
    return res.status(500).json({
      error: "Error al generar la imagen con IA",
    });
  }
};

export default handleImageGeneration;

import { NextApiRequest, NextApiResponse } from "next";
import { fetchOrGenerateImage } from "../../../services/supabase/imageService";

const handleImageGeneration = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Utiliza POST." });
  }

  try {
    const { artistName, coverType, title, username } = req.body;

    const safeArtist = artistName || "Artista";
    const safeTitle = title || "Álbum";
    const safeCoverType: "front" | "back" = coverType === "back" ? "back" : "front";

    const imageUrl = await fetchOrGenerateImage(
      safeArtist,
      safeCoverType,
      safeTitle,
      username || ""
    );

    if (imageUrl) {
      return res.status(200).json({ imageUrl });
    }

    return res.status(500).json({ error: "No se pudo generar la portada con los motores de IA disponibles." });
  } catch (error: any) {
    console.error("Error en handleImageGeneration:", error);
    return res.status(500).json({
      error: "Error al generar la imagen con IA",
      message: error?.message,
    });
  }
};

export default handleImageGeneration;

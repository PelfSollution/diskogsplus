import { NextApiRequest, NextApiResponse } from "next";
import { enrichArtistInfoWithChatGPT } from "@/services/openai/enrichArtistInfo";

const enrichArtistInfoHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const { artistName, albumName, discoId, username } = req.body;

  try {
    const enrichedInfo = await enrichArtistInfoWithChatGPT(
      artistName || "Artista",
      albumName || "Álbum",
      discoId || "",
      username || ""
    );

    return res.status(200).json({
      info: enrichedInfo,
      enrichedInfo,
    });
  } catch (error: any) {
    console.error("Error en enrichArtistInfoHandler:", error);
    return res.status(500).json({
      error: "Error al enriquecer la información del artista.",
      message: error?.message,
    });
  }
};

export default enrichArtistInfoHandler;

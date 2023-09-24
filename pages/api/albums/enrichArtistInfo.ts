
import { NextApiRequest, NextApiResponse } from "next";
import { enrichArtistInfoWithChatGPT } from "@/services/openai/enrichArtistInfo";


const enrichArtistInfoHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { artistName, albumName, discoId } = req.body;

    try {
      console.log("[Handler] Antes de llamar a enrichArtistInfoWithChatGPT");
      const enrichedInfo = await enrichArtistInfoWithChatGPT(artistName, albumName, discoId);
      console.log("[Handler] Después de llamar a enrichArtistInfoWithChatGPT", enrichedInfo);
    
      res.status(200).json({ enrichedInfo });
    } catch (error) {
      console.error("[Handler] Error al enriquecer la información:", error);
      res.status(500).json({ error: "Error al enriquecer la información del artista." });
    }
  } else {
    res.status(405).json({ error: "Método no permitido." });
  }
};

export default enrichArtistInfoHandler;

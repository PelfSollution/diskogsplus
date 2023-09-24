
import { NextApiRequest, NextApiResponse } from "next";
import { enrichArtistInfoWithChatGPT } from "@/services/openai/enrichArtistInfo";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { artistName, albumName, discoId } = req.body;

    try {
      const enrichedInfo = await enrichArtistInfoWithChatGPT(artistName, albumName, discoId);
      res.status(200).json({ enrichedInfo });
    } catch (error) {
      console.error("Error al enriquecer la información:", error);
      res.status(500).json({ error: "Error al enriquecer la información del artista." });
    }
  } else {
    res.status(405).json({ error: "Método no permitido." });
  }
};

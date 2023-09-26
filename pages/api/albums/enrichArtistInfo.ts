
import { NextApiRequest, NextApiResponse } from "next";
import { enrichArtistInfoWithChatGPT } from "@/services/openai/enrichArtistInfo";


const enrichArtistInfoHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const { artistName, albumName, discoId, username } = req.body;

    try {

      const enrichedInfo = await enrichArtistInfoWithChatGPT(artistName, albumName, discoId, username);

    
      res.status(200).json({ enrichedInfo });
    } catch (error) {

      res.status(500).json({ error: "Error al enriquecer la información del artista." });
    }
  } else {
    res.status(405).json({ error: "Método no permitido." });
  }
};

export default enrichArtistInfoHandler;

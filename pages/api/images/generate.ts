import { NextApiRequest, NextApiResponse } from "next";
import { fetchOrGenerateImage } from "../../../services/supabase/imageService";

const handleImageGeneration = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method === "POST") {
      const { artistName, coverType, title, username } = req.body;
      const imageUrl = await fetchOrGenerateImage(artistName, coverType, title, username);

      if (imageUrl) {
        res.status(200).json({ imageUrl });
      } else {
        res.status(500).json({ error: "Error al generar la imagen" });
      }
    } else {
      res.status(405).end(); // Método no permitido si no es POST
    }
  } catch (error) {
    res.status(500).json({ error: "Error al generar la imagen" });
  }
};

export default handleImageGeneration;


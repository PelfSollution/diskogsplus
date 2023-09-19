import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import addWantlistEntry, { WantlistEntry } from "@/services/supabase/addWantlistEntry";
var Discogs = require("disconnect").Client;
var CryptoJS = require("crypto-js");


export default async function addToWantlist(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { username, disco_id, notes, rating, artista, album, image_url } =
      req.body;

    const accessDatacipherObj = getCookie("accessData", { req, res });

    if (accessDatacipherObj) {
      const bytes = await CryptoJS.AES.decrypt(
        accessDatacipherObj,
        process.env.CRYPT_KEY
      );

      const accessData = await JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const userClient = new Discogs(accessData).user();
      const userWantlist = userClient.wantlist();

      const wantlistResponse = await userWantlist.addRelease(
        username,
        disco_id,
        { notes, rating }
      );
      if (wantlistResponse) {
        const logData: WantlistEntry = {
          username: username,
          disco_id: disco_id,
          notes: notes || "Sin notas",
          rating: rating || 0,
          artista: artista,
          album: album,
          image_url: image_url,
        };
        const supabaseResponse = await addWantlistEntry(logData);
        if (!supabaseResponse) {
          console.error("Error al registrar la entrada en Supabase.");
        }
      }

      res.send({ success: true, data: wantlistResponse });
    } else {
      res.send({
        success: false,
        message: "No se encontraron datos de acceso.",
      });
    }
  } catch (err: any) {
    console.error("Error al añadir al wantlist:", err);
    res.status(400).json({
      error_code: "wantlist_addition",
      message: err.message,
    });
  }
}

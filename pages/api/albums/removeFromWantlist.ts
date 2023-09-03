var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
var CryptoJS = require("crypto-js");

export default async function removeFromWantlist(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { username, releaseId } = req.body;

    const accessDatacipherObj = getCookie("accessData", { req, res });

    if (accessDatacipherObj) {
      const bytes = await CryptoJS.AES.decrypt(
        accessDatacipherObj,
        process.env.CRYPT_KEY
      );

      const accessData = await JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const userClient = new Discogs(accessData).user();
      const userWantlist = userClient.wantlist();
      console.log("Conectado a la base de datos de Discogs.");

      console.log("Eliminando el álbum de la wantlist en Discogs...");
      const removalResponse = await userWantlist.removeRelease(username, releaseId);
      console.log("removalResponse:", removalResponse);
      res.send({ success: true, data: removalResponse });
    } else {
      res.send({
        success: false,
        message: "No se encontraron datos de acceso.",
      });
    }
  } catch (err: any) {
    console.error("Error al quitar de la wantlist:", err);
    res.status(400).json({
      error_code: "wantlist_removal",
      message: err.message,
    });
  }
}

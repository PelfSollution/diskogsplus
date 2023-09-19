import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import deleteWantlistEntry from "@/services/supabase/deleteWantlistEntry";
var Discogs = require("disconnect").Client;
var CryptoJS = require("crypto-js");


export default async function removeFromWantlist(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { username, disco_id } = req.body;
    const accessDatacipherObj = getCookie("accessData", { req, res });

    if (!accessDatacipherObj) {
      return res.send({
        success: false,
        message: "No se encontraron datos de acceso.",
      });
    }

    const bytes = await CryptoJS.AES.decrypt(
      accessDatacipherObj,
      process.env.CRYPT_KEY
    );

    const accessData = await JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    const userClient = new Discogs(accessData).user();
    const userWantlist = userClient.wantlist();

    try {
      const removalResponse = await userWantlist.removeRelease(
        username,
        disco_id
      );
      const supabaseResponse = await deleteWantlistEntry(username, disco_id);

      if (!supabaseResponse) {
        throw new Error("Error al eliminar de Supabase.");
      }

      res.send({ success: true, data: removalResponse });
    } catch (discogsOrSupabaseError: any) {
      throw new Error(
        `Error durante la eliminación: ${discogsOrSupabaseError.message}`
      );
    }
  } catch (err: any) {
    res.status(400).json({
      error_code: "wantlist_removal",
      message: err.message,
    });
  }
}

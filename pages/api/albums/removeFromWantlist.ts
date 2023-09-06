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

      const removalResponse = await userWantlist.removeRelease(
        username,
        releaseId
      );
      res.send({ success: true, data: removalResponse });
    } else {
      res.send({
        success: false,
        message: "No se encontraron datos de acceso.",
      });
    }
  } catch (err: any) {
    res.status(400).json({
      error_code: "wantlist_removal",
      message: err.message,
    });
  }
}

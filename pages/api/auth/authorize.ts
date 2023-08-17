var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "cookies-next";
var CryptoJS = require("crypto-js");

export default async function authorize(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    var oAuth = new Discogs().oauth();
    const cookieOptions = {
      req,
      res,
      maxAge: 60 * 60 * 24 * 90,
      httpOnly: true,
    };

    oAuth.getRequestToken(
      process.env.CONSUMER_KEY,
      process.env.CONSUMER_SECRET,
      `${process.env.BASE_URL}/api/auth/callback/discogs`,
      async function (err: any, requestData: any) {
        if (err) {
          res
            .status(500)
            .json({
              error: "Error obteniendo el token de solicitud",
              detalles: err,
            });
          return;
        }

        const requestDataCipherObj = CryptoJS.AES.encrypt(
          JSON.stringify(requestData),
          process.env.CRYPT_KEY
        ).toString();

        setCookie("requestData", requestDataCipherObj, cookieOptions);
        
        res.redirect(requestData.authorizeUrl);
      }
    );
    // Si, por alguna razón, el callback dentro de getRequestToken no se ejecuta o falla, este tiempo límite garantiza que aún se envíe una respuesta.
    setTimeout(() => {
      if (!res.writableEnded) {
        res.status(500).json({ error: "Error interno por tiempo límite." });
      }
    }, 5000); // 5 segundos de tiempo límite
  } catch (err: unknown) {
    if (!res.writableEnded) {
      res
        .status(500)
        .json({
          error: "Error interno del servidor",
          detalles: (err as Error).message,
        });
    }
  }
}

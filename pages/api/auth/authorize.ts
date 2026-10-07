var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "cookies-next";
var CryptoJS = require("crypto-js");

export default async function authorize(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const consumerKey = process.env.CONSUMER_KEY?.trim();
    const consumerSecret = process.env.CONSUMER_SECRET?.trim();

    // 1. Validar que las credenciales de Discogs estén configuradas en .env.local
    if (!consumerKey || !consumerSecret) {
      return res.status(401).json({
        error: "Faltan las credenciales de Discogs API (CONSUMER_KEY y CONSUMER_SECRET)",
        detalles: {
          statusCode: 401,
          message:
            "No has configurado tus credenciales de desarrollador de Discogs en el archivo .env.local.",
        },
        instrucciones: [
          "1. Ve a https://www.discogs.com/settings/developers e inicia sesión.",
          "2. En 'Developer Applications', haz clic en 'Create an Application'.",
          "3. Nombra tu app 'Diskogs Plus' y pon en Callback URL: http://localhost:3000/api/auth/callback/discogs",
          "4. Copia tu 'Consumer Key' y 'Consumer Secret' y pégalos en .env.local:",
          "   CONSUMER_KEY=tu_consumer_key",
          "   CONSUMER_SECRET=tu_consumer_secret",
          "5. Reinicia el servidor 'npm run dev' e inténtalo de nuevo.",
        ],
      });
    }

    const cryptKey = process.env.CRYPT_KEY?.trim() || "clave_secreta_default_32_chars";
    const baseUrl = process.env.BASE_URL?.trim() || "http://localhost:3000";

    var oAuth = new Discogs().oauth();
    const cookieOptions = {
      req,
      res,
      maxAge: 60 * 60 * 24 * 90,
      httpOnly: true,
    };

    oAuth.getRequestToken(
      consumerKey,
      consumerSecret,
      `${baseUrl}/api/auth/callback/discogs`,
      async function (err: any, requestData: any) {
        if (err) {
          return res.status(500).json({
            error: "Error obteniendo el token de solicitud de Discogs",
            detalles: err,
            posibleCausa:
              "Verifica que el CONSUMER_KEY y CONSUMER_SECRET en .env.local coincidan exactamente con tu aplicación en https://www.discogs.com/settings/developers y que la aplicación no haya sido revocada.",
          });
        }

        const requestDataCipherObj = CryptoJS.AES.encrypt(
          JSON.stringify(requestData),
          cryptKey
        ).toString();

        setCookie("requestData", requestDataCipherObj, cookieOptions);

        return res.redirect(requestData.authorizeUrl);
      }
    );

    // Timeout de seguridad si Discogs no responde en 8 segundos
    setTimeout(() => {
      if (!res.writableEnded) {
        res.status(504).json({
          error: "Tiempo de espera agotado al conectar con los servidores de Discogs.",
        });
      }
    }, 8000);
  } catch (err: unknown) {
    if (!res.writableEnded) {
      res.status(500).json({
        error: "Error interno del servidor",
        detalles: (err as Error).message,
      });
    }
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "cookies-next";
import { addUser } from "@/services/supabase/addUser";
import { checkUserExists } from "@/services/supabase/checkUserExists";
var CryptoJS = require("crypto-js");

/**
 * Endpoint para desarrollo: Permite iniciar sesión localmente con un usuario de prueba
 * sin necesidad de pasar por el flujo OAuth de Discogs (útil para pruebas locales).
 */
export default async function devLogin(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitido en entorno de desarrollo
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "No disponible en producción." });
  }

  const username = (req.query.username as string) || (req.body?.username as string) || "demo_collector";
  const cryptKey = process.env.CRYPT_KEY;
  if (!cryptKey) {
    return res.status(500).json({ error: "Falta CRYPT_KEY en .env.local." });
  }

  const cookieOptionsClient = {
    req,
    res,
    maxAge: 60 * 60 * 24 * 90,
  };

  const cookieOptionsServer = {
    ...cookieOptionsClient,
    httpOnly: true,
  };

  try {
    const userExists = await checkUserExists(username);
    if (!userExists) {
      await addUser({ username });
    }

    const usernameCipherObj = CryptoJS.AES.encrypt(
      JSON.stringify(username),
      cryptKey
    ).toString();

    // Mock accessData
    const mockAccessData = {
      method: "oauth",
      level: 2,
      consumerKey: process.env.CONSUMER_KEY || "dev_key",
      consumerSecret: process.env.CONSUMER_SECRET || "dev_secret",
      token: "dev_token",
      tokenSecret: "dev_token_secret",
    };

    const accessDataCipherObj = CryptoJS.AES.encrypt(
      JSON.stringify(mockAccessData),
      cryptKey
    ).toString();

    setCookie("username", username, cookieOptionsClient);
    setCookie("isLoggedIn", "true", cookieOptionsClient);
    setCookie("usernameCipher", usernameCipherObj, cookieOptionsServer);
    setCookie("accessData", accessDataCipherObj, cookieOptionsServer);

    if (req.method === "POST") {
      return res.status(200).json({ success: true, username });
    }

    return res.redirect("/dashboard");
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

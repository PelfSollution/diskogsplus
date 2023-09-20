var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie, setCookie } from "cookies-next";
var CryptoJS = require("crypto-js");
import { addUser } from "@/services/supabase/addUser";
import { checkUserExists } from "@/services/supabase/checkUserExists";

export default async function discogsCallback(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { oauth_verifier, oauth_token } = req.query;

    const cookieOptionsClient = {
      req,
      res,
      maxAge: 60 * 60 * 24 * 90, //90 days
    };

    const cookieOptionsServer = {
      ...cookieOptionsClient,
      httpOnly: true,
    };

    const requestDatacipherObj = getCookie("requestData", { req, res });

    const bytes = await CryptoJS.AES.decrypt(
      requestDatacipherObj,
      process.env.CRYPT_KEY
    );

    const requestData = await JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    var oAuth = await new Discogs(requestData).oauth();

    await oAuth.getAccessToken(
      oauth_verifier,
      async function (err: any, accessData: any) {
        if (err) {
          console.error("Error obteniendo el token de acceso:", err);
          throw err;
        }

        const accessDataCipherObj = await CryptoJS.AES.encrypt(
          JSON.stringify(accessData),
          process.env.CRYPT_KEY
        ).toString();

        var dis = await new Discogs(accessData);
        const userId = await dis.getIdentity();
        const usernameCipherObj = await CryptoJS.AES.encrypt(
          JSON.stringify(userId.username),
          process.env.CRYPT_KEY
        ).toString();

        const userExists = await checkUserExists(userId.username);

        if (!userExists) {
            
            await addUser({ username: userId.username }); 
        }

        setCookie("username", userId.username, cookieOptionsClient);
        setCookie("isLoggedIn", true, cookieOptionsClient);
        setCookie("accessData", accessDataCipherObj, cookieOptionsServer);
        setCookie("usernameCipher", usernameCipherObj, cookieOptionsServer);
        setCookie("discogsVerifier", oauth_verifier, cookieOptionsServer);
        setCookie("discogsToken", oauth_token, cookieOptionsServer);
        res.redirect("/dashboard");
      }
    );
  } catch (err) {
    console.error("Error general en el callback:", err);
    res.send(err);
  }
}

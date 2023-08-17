var Discogs = require('disconnect').Client;
import { NextApiRequest, NextApiResponse } from 'next';
import { getCookie, setCookie } from 'cookies-next';
var CryptoJS = require('crypto-js');

export default async function discogsCallback(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("Inicio del callback");

    const { oauth_verifier, oauth_token } = req.query;

    console.log("Datos recibidos del query:", oauth_verifier, oauth_token);

    const cookieOptionsClient = {
      req,
      res,
      maxAge: 60 * 60 * 24 * 90, //90 days
    };

    const cookieOptionsServer = {
      ...cookieOptionsClient,
      httpOnly: true,
    };

    const requestDatacipherObj = getCookie('requestData', { req, res });
    console.log("requestDatacipherObj obtenido:", requestDatacipherObj);

    const bytes = await CryptoJS.AES.decrypt(
      requestDatacipherObj,
      process.env.CRYPT_KEY
    );
    const requestData = await JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    console.log("requestData descifrado:", requestData);

    var oAuth = await new Discogs(requestData).oauth();

    await oAuth.getAccessToken(
      oauth_verifier,
      async function (err: any, accessData: any) {
        if (err) {
          console.error("Error obteniendo el token de acceso:", err);
          throw err;
        }

        console.log("AccessData recibido:", accessData);

        const accessDataCipherObj = await CryptoJS.AES.encrypt(
          JSON.stringify(accessData),
          process.env.CRYPT_KEY
        ).toString();

        var dis = await new Discogs(accessData);
        const userId = await dis.getIdentity();

        console.log("UserId obtenido:", userId);

        const usernameCipherObj = await CryptoJS.AES.encrypt(
          JSON.stringify(userId.username),
          process.env.CRYPT_KEY
        ).toString();

        setCookie('username', userId.username, cookieOptionsClient);
        setCookie('isLoggedIn', true, cookieOptionsClient);
        setCookie('accessData', accessDataCipherObj, cookieOptionsServer);
        setCookie('usernameCipher', usernameCipherObj, cookieOptionsServer);
        setCookie('discogsVerifier', oauth_verifier, cookieOptionsServer);
        setCookie('discogsToken', oauth_token, cookieOptionsServer);

        console.log("Cookies seteados, redirigiendo a /dashboard");
        res.redirect('/dashboard');
      }
    );
  } catch (err) {
    console.error("Error general en el callback:", err);
    res.send(err);
  }
}

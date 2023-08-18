var Discogs = require('disconnect').Client;
import { NextApiRequest, NextApiResponse } from 'next';
import { getCookie } from 'cookies-next';
var CryptoJS = require('crypto-js');

export default async function identity(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Obtener cookies cifradas
    const usernameCipher = getCookie('usernameCipher', { req, res });
    const accessDatacipherObj = getCookie('accessData', { req, res });

    // Si no existen las cookies, responder con un objeto vacío
    if (!usernameCipher || !accessDatacipherObj) {
      return res.send({ userProfile: {} });
    }

    // Desencriptar la cookie de datos de acceso
    const accessBytes = CryptoJS.AES.decrypt(
      accessDatacipherObj,
      process.env.CRYPT_KEY
    );
    const accessData = JSON.parse(accessBytes.toString(CryptoJS.enc.Utf8));

    // Desencriptar la cookie del nombre de usuario
    const usernameBytes = CryptoJS.AES.decrypt(
      usernameCipher,
      process.env.CRYPT_KEY
    );
    const username = JSON.parse(usernameBytes.toString(CryptoJS.enc.Utf8));

    // Si no existen el nombre de usuario o los datos de acceso, responder con un objeto vacío
    if (!username || !accessData) {
      return res.send({ userProfile: {} });
    }

    // Conectar con Discogs y obtener el perfil de usuario
    var dis = new Discogs(accessData);
    const userProfile = await dis.user().getProfile(username);

    // Responder con el perfil de usuario
    if (userProfile) {
      return res.send({ userProfile });
    } else {
      return res.status(401).json({ error: 'Error. No such user.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
}


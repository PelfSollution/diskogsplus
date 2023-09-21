var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
var CryptoJS = require("crypto-js");

// Defino la estructura de la colección con sus respectivos campos.
interface CollectionInterface {
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
  releases: {
    id: number;
    basic_information: { formats: [{ name: string }] };
  }[];
}

// Esta función obtiene los datos del usuario.
// Requiere el objeto accessData que está almacenado y cifrado como cookie.
export default async function catalog(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Obtengo la página y el número de entradas por página.
    const { page, per_page } = req.query;

    // Extraigo las cookies.
    const usernameCipher = getCookie("usernameCipher", { req, res });
    const accessDatacipherObj = getCookie("accessData", { req, res });

    // Si no encuentro las cookies, devuelvo una respuesta vacía.
    if (!usernameCipher || !accessDatacipherObj) {
      res.send({ pagination: {}, releases: [] });
    }

    // Descifro el objeto cookie de accessData.
    const accessBytes = await CryptoJS.AES.decrypt(
      accessDatacipherObj,
      process.env.CRYPT_KEY
    );

    const accessData = await JSON.parse(
      accessBytes.toString(CryptoJS.enc.Utf8)
    );

    // Descifro el nombre de usuario.
    const usernameBytes = await CryptoJS.AES.decrypt(
      usernameCipher,
      process.env.CRYPT_KEY
    );

    const username = await JSON.parse(
      usernameBytes.toString(CryptoJS.enc.Utf8)
    );

    // Si no tengo el nombre de usuario o los datos de acceso, devuelvo una respuesta vacía.
    if (!username || !accessData) {
      res.send({ pagination: {}, releases: [] });
    }

    // Obtengo la página de la colección del usuario usando la API de Discogs.
    var dis = await new Discogs(accessData);

    const userCollection: CollectionInterface = await dis
      .user()
      .collection()
      .getReleases(username, 0, {
        page: page,
        per_page: per_page,
        sort: "artist",
        sort_order: "asc",
      });

    // Solo quiero los álbumes en formato vinilo.
    const filteredCollection = userCollection.releases.filter((album) => {
      if (album.basic_information.formats[0].name === "Vinyl") return album;
    });

    const totalDiscos = userCollection.pagination.items;
    const totalDiscosVinyl = filteredCollection.length;
    

    const vinylCollection = {
      pagination: {
        ...userCollection.pagination,
        totalDiscos: totalDiscos,
      },
      releases: filteredCollection,
    };
    // Si tengo una colección de vinilos, la envío. De lo contrario, envío una respuesta vacía.
    if (vinylCollection.releases.length > 0) {
      res.send(vinylCollection);
    } else {
      res.send({ pagination: {}, releases: [] });
    }
  } catch (err) {
    // Si ocurre algún error, lo envío en la respuesta.
    res.send(err);
  }
}

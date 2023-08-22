var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
var CryptoJS = require("crypto-js");

async function fetchLastfmData(albumName: string, artistName?: string) {
  const apiKey = process.env.LASTFM_API_KEY;
  const baseUrl = "http://ws.audioscrobbler.com/2.0/?method=album.getinfo";
  const format = "&format=json";
  const url = `${baseUrl}&api_key=${apiKey}&album=${albumName}${
    artistName ? `&artist=${artistName}` : ""
  }${format}`;

  // Aquí está el console.log para imprimir la URL:
  console.log("URL for Last.fm request:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch from Last.fm");
  }
  return response.json();
}


// Esta función obtiene los datos del álbum del usuario.
// Necesita el objeto accessData que está almacenado y cifrado como cookie.
export default async function albumInfo(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Obtengo el ID del lanzamiento y el ID maestro.
    const { id, masterId } = req.query;

    // Descifro el objeto cookie de accessData.
    const accessDatacipherObj = getCookie("accessData", { req, res });

    if (accessDatacipherObj) {
      const bytes = await CryptoJS.AES.decrypt(
        accessDatacipherObj,
        process.env.CRYPT_KEY
      );

      // Aquí está mi objeto accessData descifrado.
      const accessData = await JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      // Me conecto a la base de datos de Discogs.
      var db = await new Discogs(accessData).database();

      // Obtengo los datos de un lanzamiento específico del álbum.
      const releaseData = await db.getRelease(id);

      // Algunos lanzamientos no tienen un maestro asociado.
      // Esto es evidente cuando Discogs devuelve '0' como el ID maestro.
      // Si es así, tomaré parte de los datos del lanzamiento en lugar de eso.
      let masterReleaseData = null;
      let hasValidMasterId = false;

      if (masterId && masterId !== "0") {
        masterReleaseData = await db.getMaster(masterId);
        hasValidMasterId = true;
      }

      let selectedTracklist = releaseData.tracklist;

      // Si el lanzamiento tiene duraciones de pista, las uso.
      // Si no, intento con el lanzamiento maestro.
      // De lo contrario, envío la lista de pistas del lanzamiento sin las duraciones.
      if (releaseData.tracklist && releaseData.tracklist[0].duration !== "") {
        selectedTracklist = releaseData.tracklist;
      } else if (releaseData.master_id && releaseData.master_id !== "0") {
        if (hasValidMasterId) {
          selectedTracklist = masterReleaseData.tracklist;
        }
      }

      // Recopilo la información del álbum.
      const albumInfo = {
        label: releaseData.labels[0].name,
        catalogNo: releaseData.labels[0].catno,
        rating: releaseData.community.rating.average,
        released: releaseData.released,
        country: releaseData.country,
        genres: hasValidMasterId
          ? masterReleaseData.genres
          : releaseData.genres,
        styles: hasValidMasterId
          ? masterReleaseData.styles
          : releaseData.styles,
        tracklist: selectedTracklist,
      };

      //... (mantén tu código existente aquí)

      const discogsData = {
        label: releaseData.labels[0].name,
        //... (todos tus otros datos de Discogs)
      };

      let lastfmTags: string[] = [];

      try {
        const lastfmResponse = await fetchLastfmData(
          releaseData.title,
          releaseData.artists ? releaseData.artists[0].name : undefined
        );
        if (lastfmResponse.album && lastfmResponse.album.tags) {
          lastfmTags = lastfmResponse.album.tags.tag.map(
            (tag: any) => tag.name
          );
        }
      } catch (error) {
        console.error("Error fetching Last.fm data:", error);
      }

      const combinedData = {
        ...discogsData,
        lastfmTags: lastfmTags,
      };

      console.log("Combined data:", combinedData);
      res.send({ albumInfo: combinedData });

    } else {
      // Si no tengo datos de acceso, envío una respuesta vacía.
      res.send({
        albumInfo: {},
      });
    }
  } catch (err: any) {
    // Si ocurre algún error, lo envío con un código 400 y un mensaje específico.
    res.status(400).json({
      error_code: "album_info",
      message: err.message,
    });
  }
}

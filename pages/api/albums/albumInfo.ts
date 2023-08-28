var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
var CryptoJS = require("crypto-js");
import { enrichArtistInfoWithChatGPT } from "../../../services/openai/enrichArtistInfo";

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description);
  }

  return data.access_token;
}


async function getSpotifyAlbumId(albumName: string, artistName: string, accessToken: string) {
  const response = await fetch(`https://api.spotify.com/v1/search?q=album:${albumName} artist:${artistName}&type=album`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  if (data.albums.items.length === 0) {
    return null;
  }

  return data.albums.items[0].id;
}

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
      console.log("Decrypted accessData:", accessData);

      // Me conecto a la base de datos de Discogs.
      var db = await new Discogs(accessData).database();

      // Obtengo los datos de un lanzamiento específico del álbum.
      console.log("Making request to Discogs API...");
      const releaseData = await db.getRelease(id);
      console.log("Received data from Discogs API:", releaseData);

          // Autenticación en Spotify para obtener el token de acceso.
    const accessToken = await getSpotifyAccessToken();
    const spotifyAlbumId = await getSpotifyAlbumId(releaseData.title, releaseData.artists[0].name, accessToken);
    

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

      interface Image {
        type: string;
        uri: string;
        resource_url: string;
        uri150: string;
        width: number;
        height: number;
      }

      const frontCover = releaseData.images.find((image: Image) => image.type === 'primary')?.uri || '';
      const backCover = releaseData.images.find((image: Image) => image.type === 'secondary')?.uri || frontCover;
      
      console.log("CHIVATO");
      console.log("Front cover:", frontCover);
      console.log("Back cover:", backCover);



  // Recopilo la información del álbum.
const albumInfo = {
  label: releaseData.labels[0].name,
  catalogNo: releaseData.labels[0].catno,
  rating: releaseData.community.rating.average,
  released: releaseData.released,
  country: releaseData.country,
  genres: hasValidMasterId ? masterReleaseData.genres : releaseData.genres,
  styles: hasValidMasterId ? masterReleaseData.styles : releaseData.styles,
  tracklist: selectedTracklist,
  coverImage: frontCover,
  backCoverImage: backCover,
  artist: releaseData.artists[0].name,
  title: releaseData.title,
};

// Enriquece la información del artista usando ChatGPT
let enrichedArtistInfo = "";
if (releaseData.artists && releaseData.artists[0]?.name) {
  enrichedArtistInfo = await enrichArtistInfoWithChatGPT(releaseData.artists[0].name);
}

let lastfmTags: string[] = [];

try {
  const lastfmResponse = await fetchLastfmData(
    releaseData.title,
    releaseData.artists ? releaseData.artists[0].name : undefined
  );
  if (lastfmResponse.album && lastfmResponse.album.tags) {
    lastfmTags = lastfmResponse.album.tags.tag.map((tag: any) => tag.name);
  }
} catch (error) {
  console.error("Error fetching Last.fm data:", error);
}

const combinedData = {
  ...albumInfo, // Incorporamos la información recopilada previamente
  enrichedInfo: enrichedArtistInfo, 
  lastfmTags: lastfmTags,
  spotifyAlbumId: spotifyAlbumId,
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
    console.error("Error in albumInfo:", err);
    res.status(400).json({
      error_code: "album_info",
      message: err.message,
    });
  }
}

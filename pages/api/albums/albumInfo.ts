var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
var CryptoJS = require("crypto-js");
import { enrichArtistInfoWithChatGPT } from "../../../services/openai/enrichArtistInfo";
import { fetchLastfmData } from "../../../services/last.fm/fetchData";
import { getSpotifyAccessToken } from "../../../services/spotify/getAccessToken";
import { getSpotifyAlbumId } from "../../../services/spotify/getAlbumId";
import { getSpotifyTrackId } from "../../../services/spotify/getTrackId";
import { getTrackAudioFeatures } from "../../../services/spotify/getTrackAudioFeatures";
import { getMostPopularAlbum } from "../../../services/spotify/getMostPopularAlbum";
import { fetchOrGenerateImage } from "../../../services/supabase/imageService";
import  { removeAllSubstringsInParenthesis }  from "@/lib/stringUtils";




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
      //console.log("Decrypted accessData:", accessData);

      // Me conecto a la base de datos de Discogs.
      var db = await new Discogs(accessData).database();

      // Obtengo los datos de un lanzamiento específico del álbum.
      const releaseData = await db.getRelease(id);
    


      // Autenticación en Spotify para obtener el token de acceso.
      const accessToken = await getSpotifyAccessToken();
      let spotifyAlbumId = await getSpotifyAlbumId(
        releaseData.title,
        releaseData.artists[0].name,
        accessToken
      );

      let isPopularAlbum = false; // Esta variable determinará si estamos usando el álbum más popular.

  // Si no encontramos el ID del álbum en Spotify, entonces intentamos obtener el álbum más popular del artista.
if (!spotifyAlbumId && releaseData.artists[0].name) {
  const popularAlbumId = await getMostPopularAlbum(releaseData.artists[0].name, accessToken);
  if (popularAlbumId) {
    spotifyAlbumId = popularAlbumId;
    isPopularAlbum = true; // Si encontramos el álbum popular, actualizamos la variable a true.
  }
}

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
      console.log("Selected tracklist:", selectedTracklist);

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

      const millisToMinutesAndSeconds = (millis: number): string => {
        let minutes = Math.floor(millis / 60000);
        let seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, "0")}`;
    };
    
      const tracklistWithSpotifyIds = await Promise.all(
        selectedTracklist.map(async (track: any) => {
          try {
            // Asegurarse de que releaseData.artists tenga al menos un artista y obtener el primer nombre.
            const primaryArtistName = releaseData.artists && releaseData.artists.length > 0 
              ? releaseData.artists[0].name 
              : '';
      
            const spotifyTrackData = await getSpotifyTrackId(
              track.title,
              primaryArtistName,
              releaseData.title,
              accessToken
            );
      
            // Si no tenemos datos de Spotify o la URI no tiene la estructura esperada, retornamos el track sin cambios.
            if (!spotifyTrackData || !spotifyTrackData.uri || spotifyTrackData.uri.split(":").length !== 3) {
              return {
                ...track,
                spotifyTrackId: null,
                spotifyUri: null,
              };
            }
      
            const spotifyTrackId = spotifyTrackData.uri.split(":")[2];
            const trackFeatures = await getTrackAudioFeatures(
              spotifyTrackId,
              accessToken
            );
      
            let tempo = null;
            let key = null;
            let mode = null;
            let duration = null;
      
            if (trackFeatures) {
              tempo = trackFeatures.tempo ?? null; // Usamos el operador 'nullish coalescing' para manejar undefined y null.
              key = trackFeatures.key ?? null;
              mode = trackFeatures.mode ?? null;
              duration = trackFeatures.duration_ms ?? null;
            }
      
            return {
              ...track,
              spotifyTrackId,
              spotifyUri: spotifyTrackData.uri,
              tempo,
              key,
              mode,
              duration: duration !== null ? millisToMinutesAndSeconds(duration) : null
            };
          } catch (error) {
            console.error(`Error procesando el track ${track.title}:`, error);
            return { ...track }; // En caso de error, retornamos el track sin cambios.
          }
        })
      );
      

      interface Image {
        type: string;
        uri: string;
        resource_url: string;
        uri150: string;
        width: number;
        height: number;
      }

      const frontCover =
      releaseData.images.find((image: Image) => image.type === "primary")?.uri;
  const backCover =
      releaseData.images.find((image: Image) => image.type === "secondary")?.uri;

    
  
    const generatedFrontCover = frontCover || await fetchOrGenerateImage(releaseData.artists[0].name, 'front');
    const generatedBackCover = backCover || await fetchOrGenerateImage(releaseData.artists[0].name, 'back');
    



      // Recopilo la información del álbum.
      const albumInfo = {
        label: removeAllSubstringsInParenthesis(releaseData.labels[0].name),
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
        tracklist: tracklistWithSpotifyIds,
        //coverImage: frontCover,
        //backCoverImage: backCover,
        coverImage: generatedFrontCover,
        backCoverImage: generatedBackCover,
        artist: removeAllSubstringsInParenthesis(releaseData.artists[0].name),
        title: releaseData.title,
      
      };

      // Enriquece la información del artista usando ChatGPT
      let enrichedArtistInfo = "";
      if (releaseData.artists && releaseData.artists[0]?.name) {
        enrichedArtistInfo = await enrichArtistInfoWithChatGPT(
          releaseData.artists[0].name
        );
      }

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
        ...albumInfo,
        enrichedInfo: removeAllSubstringsInParenthesis(enrichedArtistInfo), //ojo con esto
        lastfmTags: lastfmTags,
        spotifyAlbumId: spotifyAlbumId, 
        isPopularAlbum: isPopularAlbum
      };
      console.log("Combined data:", combinedData);

      res.send({ albumInfo: combinedData });
    } else {
      res.send({
        albumInfo: {},
      });
    }
  } catch (err: any) {
    console.error("Error in albumInfo:", err);
    res.status(400).json({
      error_code: "album_info",
      message: err.message,
    });
  }
}

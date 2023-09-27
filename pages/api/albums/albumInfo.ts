var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
var CryptoJS = require("crypto-js");
import { getArtistInfoFromSupabase } from "../../../services/supabase/getArtistInfoSupabase";
import { fetchLastfmData, fetchSimilarArtists, fetchSimilarTracks, fetchArtistInfo } from "../../../services/last.fm/fetchData";
import { getSpotifyAccessToken } from "../../../services/spotify/getAccessToken";
import { getSpotifyAlbumId } from "../../../services/spotify/getAlbumId";
import { getMostPopularAlbum } from "../../../services/spotify/getMostPopularAlbum";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { getTracklistWithSpotifyIds } from "../../../services/spotify/getTracklistWithSpotifyIds";
import { getArtistImageFromSupabase } from "../../../services/supabase/getArtistImageFromSupabase";
import { SimilarArtist } from "@/types/types";

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
        const popularAlbumId = await getMostPopularAlbum(
          releaseData.artists[0].name,
          accessToken
        );
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


      const tracklistWithSpotifyIds = await getTracklistWithSpotifyIds(
        selectedTracklist,
        releaseData,
        accessToken
      );

      interface Image {
        type: string;
        uri: string;
        resource_url: string;
        uri150: string;
        width: number;
        height: number;
      }

      const frontCover = releaseData.images.find(
        (image: Image) => image.type === "primary"
      )?.uri;
      const backCover = releaseData.images.find(
        (image: Image) => image.type === "secondary"
      )?.uri;

      const generatedFrontCover =
        frontCover ||
        (await getArtistImageFromSupabase(releaseData.artists[0].name));
      const generatedBackCover =
        backCover ||
        (await getArtistImageFromSupabase(releaseData.artists[0].name));


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
        // coverImage: frontCover,
        // backCoverImage: backCover,
        coverImage: generatedFrontCover,
        backCoverImage: generatedBackCover,
        artist: removeAllSubstringsInParenthesis(releaseData.artists[0].name),
        title: releaseData.title,
        videos: releaseData.videos,
        
      };

      let enrichedArtistInfoFromDb = await getArtistInfoFromSupabase(releaseData.id);


      if (!enrichedArtistInfoFromDb) {
          enrichedArtistInfoFromDb = ""; 
      }
      

      let lastfmTags: string[] = [];
      let similarArtists: any[] = [];
      let similarTracks: any[] = [];
      let artistBio: string | null = null; 
      
      try {
        const artistName = releaseData.artists ? releaseData.artists[0].name : undefined;
      
        if (artistName) {
     
          const lastfmResponse = await fetchLastfmData(releaseData.title, artistName);

          if (lastfmResponse.album && lastfmResponse.album.tags) {
            lastfmTags = lastfmResponse.album.tags.tag.map((tag: any) => tag.name);
          }

          const artistInfoResponse = await fetchArtistInfo(artistName);
          if (artistInfoResponse.artist && artistInfoResponse.artist.bio) {
            artistBio = artistInfoResponse.artist.bio.content;
          }
      
          const firstTrackName = selectedTracklist && selectedTracklist.length > 0 ? selectedTracklist[0].title : undefined;

          
          if (firstTrackName) {
            const trackSimilarResponse = await fetchSimilarTracks(artistName, firstTrackName, 6);

            
            if (trackSimilarResponse && trackSimilarResponse.similartracks && trackSimilarResponse.similartracks.track) {
              similarTracks = trackSimilarResponse.similartracks.track.slice(0, 6);
    
            }
          }
          
      
          const artistSimilarResponse = await fetchSimilarArtists(artistName, 6);
          
          if (artistSimilarResponse && artistSimilarResponse.similarartists && artistSimilarResponse.similarartists.artist) {
            similarArtists = artistSimilarResponse.similarartists.artist.slice(0, 6).map((artist: SimilarArtist) => {
              const smallImage = artist.image.find((img: any) => img.size === "medium");
              const imageUrl = smallImage ? smallImage["#text"] : null;
              return {
                ...artist,
                smallImage: imageUrl
              };
            });
          }
        }
      } catch (error) {
        console.error("Error al obtener datos de Last.fm:", error);
      }
      

      const combinedData = {
        ...albumInfo,
        enrichedInfo: removeAllSubstringsInParenthesis(enrichedArtistInfoFromDb),
        lastfmTags: lastfmTags,
        spotifyAlbumId: spotifyAlbumId,
        isPopularAlbum: isPopularAlbum,
        similarArtists: similarArtists,
        similarTracks: similarTracks,
        artistBio: artistBio,
      };

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

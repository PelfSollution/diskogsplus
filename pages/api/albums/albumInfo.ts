import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import { getArtistInfoFromSupabase } from "../../../services/supabase/getArtistInfoSupabase";
import {
  fetchLastfmData,
  fetchSimilarArtists,
  fetchSimilarTracks,
  fetchArtistInfo,
} from "../../../services/last.fm/fetchData";
import { getSpotifyAccessToken } from "../../../services/spotify/getAccessToken";
import { getSpotifyAlbumId } from "../../../services/spotify/getAlbumId";
import { getMostPopularAlbum } from "../../../services/spotify/getMostPopularAlbum";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { enrichTracklistWithAudioFeatures } from "../../../services/audioFeatures/getTrackAudioFeatures";
import { getArtistImageFromSupabase } from "../../../services/supabase/getArtistImageFromSupabase";
import { SimilarArtist } from "@/types/types";

var Discogs = require("disconnect").Client;
var CryptoJS = require("crypto-js");

async function fetchDiscogsRelease(releaseId: string | number, accessData: any) {
  // Validar releaseId
  if (!releaseId || releaseId === "NaN" || releaseId === "undefined" || releaseId === "0") {
    throw new Error("ID de vinilo inválido");
  }

  // 1. Intentar con OAuth si accessData es válido y no es de desarrollo
  if (accessData && accessData.token && !accessData.token.startsWith("dev_")) {
    try {
      const db = new Discogs(accessData).database();
      const data = await db.getRelease(releaseId);
      if (data && data.title) return data;
    } catch (e: any) {
      console.warn("[Discogs] Fallo con accessData de Discogs, recurriendo a API pública:", e?.message);
    }
  }

  // 2. Consulta a la API pública de Discogs con fallback resiliente
  const baseHeaders: Record<string, string> = {
    "User-Agent": "DiskogsPlus/2.0 (musical-agent-assistant; +https://diskogsplus.local)",
    "Accept": "application/json",
  };

  const key = process.env.CONSUMER_KEY?.trim();
  const secret = process.env.CONSUMER_SECRET?.trim();
  const headersWithAuth: Record<string, string> = { ...baseHeaders };

  if (key && secret) {
    headersWithAuth.Authorization = `Discogs key=${key}, secret=${secret}`;
  }

  // Intento 1: con Authorization si existe
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
      headers: headersWithAuth,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Si devuelve 200, retornamos directamente
    if (res.ok) {
      return await res.json();
    }

    // Si devuelve 401 o 403 (claves inválidas/expiradas), reintentar sin Authorization
    if ((res.status === 401 || res.status === 403) && headersWithAuth.Authorization) {
      console.warn(`[Discogs] Error ${res.status} con Authorization header. Reintentando consulta pública...`);
      const retryController = new AbortController();
      const retryTimeout = setTimeout(() => retryController.abort(), 8000);

      const retryRes = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
        headers: baseHeaders,
        signal: retryController.signal,
      });
      clearTimeout(retryTimeout);

      if (retryRes.ok) {
        return await retryRes.json();
      }
      throw new Error(`Discogs API pública respondió con status ${retryRes.status}: ${retryRes.statusText}`);
    }

    throw new Error(`Discogs API respondió con status ${res.status}: ${res.statusText}`);
  } catch (err: any) {
    // Si fue error de abort/timeout o red con headersWithAuth, intentar una última vez puramente pública
    if (headersWithAuth.Authorization) {
      try {
        console.warn("[Discogs] Falló primer intento con credenciales, probando API pública limpia...");
        const cleanRes = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
          headers: baseHeaders,
        });
        if (cleanRes.ok) return await cleanRes.json();
      } catch (cleanErr: any) {
        console.error("[Discogs] Falló también la consulta pública limpia:", cleanErr?.message);
      }
    }
    throw err;
  }
}

export default async function albumInfo(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, masterId } = req.query;

    if (!id || id === "NaN" || id === "undefined" || id === "0") {
      return res.status(400).json({ error: "Se requiere un ID de lanzamiento válido (releaseId)." });
    }

    // 1. Descifrar datos de acceso si existen en cookies
    let accessData: any = null;
    const accessDatacipherObj = getCookie("accessData", { req, res });
    if (accessDatacipherObj && process.env.CRYPT_KEY) {
      try {
        const bytes = CryptoJS.AES.decrypt(accessDatacipherObj, process.env.CRYPT_KEY);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedStr) {
          accessData = JSON.parse(decryptedStr);
        }
      } catch (err) {
        console.warn("No se pudo descifrar accessData de cookies:", err);
      }
    }

    // 2. Obtener los datos oficiales del vinilo desde Discogs
    const releaseData = await fetchDiscogsRelease(id as string, accessData);

    if (!releaseData || !releaseData.title) {
      return res.status(404).json({ error: "No se encontró el álbum en Discogs." });
    }

    const artistName =
      releaseData.artists && releaseData.artists.length > 0
        ? releaseData.artists[0].name
        : "Artista Desconocido";

    let selectedTracklist = Array.isArray(releaseData.tracklist)
      ? releaseData.tracklist
          // Discogs incluye cabeceras ("Side A", etc.) como entradas sin posición
          .filter((t: any) => t.type_ !== "heading")
          .map((t: any) => ({
            position: t.position || "",
            title: t.title || "",
            duration: t.duration || "",
            // En recopilatorios cada pista tiene su propio artista
            artist: t.artists?.[0]?.name
              ? removeAllSubstringsInParenthesis(t.artists[0].name)
              : undefined,
          }))
      : [];

    // 3. BPM y tonalidad (ReccoBeats, con Deezer como respaldo)
    let tracklistWithFeatures = selectedTracklist;
    try {
      tracklistWithFeatures = await enrichTracklistWithAudioFeatures(
        selectedTracklist,
        removeAllSubstringsInParenthesis(artistName),
        releaseData.title
      );
    } catch (featuresError: any) {
      console.warn("[AudioFeatures] Aviso (BPM/tonalidad omitidos):", featuresError?.message);
    }

    // 4. Enriquecimiento opcional con Spotify (solo el embed del álbum)
    let spotifyAlbumId: string | null = null;
    let isPopularAlbum = false;

    const hasSpotifyCredentials = Boolean(
      process.env.SPOTIFY_CLIENT_ID?.trim() && process.env.SPOTIFY_CLIENT_SECRET?.trim()
    );

    if (hasSpotifyCredentials) {
      try {
        const accessToken = await getSpotifyAccessToken();
        if (accessToken) {
          spotifyAlbumId = await getSpotifyAlbumId(
            releaseData.title,
            artistName,
            accessToken
          );

          if (!spotifyAlbumId && artistName) {
            const popularAlbumId = await getMostPopularAlbum(artistName, accessToken);
            if (popularAlbumId) {
              spotifyAlbumId = popularAlbumId;
              isPopularAlbum = true;
            }
          }
        }
      } catch (spotifyError: any) {
        console.warn(
          "[Spotify] Aviso (enriquecimiento de Spotify omitido):",
          spotifyError?.message
        );
      }
    }

    // 5. Portadas (Front y Back cover)
    interface DiscogsImage {
      type: string;
      uri: string;
    }

    const frontCover = Array.isArray(releaseData.images)
      ? releaseData.images.find((image: DiscogsImage) => image.type === "primary")?.uri ||
        releaseData.images[0]?.uri
      : null;

    const backCover = Array.isArray(releaseData.images)
      ? releaseData.images.find((image: DiscogsImage) => image.type === "secondary")?.uri
      : null;

    const generatedFrontCover =
      frontCover || (await getArtistImageFromSupabase(artistName));
    const generatedBackCover =
      backCover || (await getArtistImageFromSupabase(artistName));

    // 6. Enriquecimiento opcional con Last.fm (Bio, tags, artistas similares, tracks similares)
    let lastfmTags: string[] = [];
    let similarArtists: any[] = [];
    let similarTracks: any[] = [];
    let artistBio: string | null = null;

    if (process.env.LASTFM_API_KEY?.trim() && artistName) {
      try {
        const [albumRes, artistRes, similarRes] = await Promise.allSettled([
          fetchLastfmData(releaseData.title, artistName),
          fetchArtistInfo(artistName),
          fetchSimilarArtists(artistName, 6),
        ]);

        if (albumRes.status === "fulfilled" && albumRes.value?.album?.tags?.tag) {
          const tags = albumRes.value.album.tags.tag;
          lastfmTags = Array.isArray(tags) ? tags.map((tag: any) => tag.name) : [tags.name];
        }

        if (artistRes.status === "fulfilled" && artistRes.value?.artist?.bio?.content) {
          artistBio = artistRes.value.artist.bio.content;
        }

        if (similarRes.status === "fulfilled" && similarRes.value?.similarartists?.artist) {
          similarArtists = similarRes.value.similarartists.artist.slice(0, 6).map((artist: SimilarArtist) => {
            const smallImage = artist.image?.find((img: any) => img.size === "medium");
            return {
              ...artist,
              smallImage: smallImage ? smallImage["#text"] : null,
            };
          });
        }

        // Tracks similares del primer tema
        const firstTrackName =
          selectedTracklist.length > 0 ? selectedTracklist[0].title : undefined;

        if (firstTrackName) {
          try {
            const trackSimilarResponse = await fetchSimilarTracks(artistName, firstTrackName, 6);
            if (trackSimilarResponse?.similartracks?.track) {
              similarTracks = trackSimilarResponse.similartracks.track.slice(0, 6);
            }
          } catch {
            // Silencioso si no hay tracks similares
          }
        }
      } catch (lastfmError: any) {
        console.warn("[Last.fm] Aviso al procesar metadatos:", lastfmError?.message);
      }
    }

    // 7. Información enriquecida previa de Supabase
    let enrichedArtistInfoFromDb = "";
    try {
      const dbInfo = await getArtistInfoFromSupabase(releaseData.id);
      if (dbInfo) enrichedArtistInfoFromDb = dbInfo;
    } catch {
      enrichedArtistInfoFromDb = "";
    }

    const primaryLabel = Array.isArray(releaseData.labels) && releaseData.labels[0]
      ? releaseData.labels[0]
      : { name: "Independiente", catno: "" };

    const combinedData = {
      id: releaseData.id,
      label: removeAllSubstringsInParenthesis(primaryLabel.name || "Desconocido"),
      catalogNo: primaryLabel.catno || "",
      rating: releaseData.community?.rating?.average || 0,
      released: releaseData.released || releaseData.year || "",
      year: releaseData.year || releaseData.released || "",
      releaseDate: releaseData.released || releaseData.year || "",
      country: releaseData.country || "Desconocido",
      genres: releaseData.genres || [],
      styles: releaseData.styles || [],
      tracklist: tracklistWithFeatures,
      coverImage: generatedFrontCover || "/no-portada.gif",
      backCoverImage: generatedBackCover || null,
      artist: removeAllSubstringsInParenthesis(artistName),
      title: releaseData.title,
      videos: releaseData.videos || [],
      enrichedInfo: removeAllSubstringsInParenthesis(enrichedArtistInfoFromDb),
      lastfmTags,
      spotifyAlbumId,
      isPopularAlbum,
      similarArtists,
      similarTracks,
      artistBio,
    };

    return res.status(200).json({ albumInfo: combinedData });
  } catch (err: any) {
    console.error("Error en endpoint albumInfo:", err);
    return res.status(500).json({
      error: "Error obteniendo información del disco",
      message: err.message,
    });
  }
}

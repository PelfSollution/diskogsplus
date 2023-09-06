import { getSpotifyAlbumId } from "./getAlbumId";

interface SpotifyTrackItem {
  id: string;
  name: string;
}

const SPOTIFY_BASE_URL = "https://api.spotify.com";

function getFirstWord(str: string): string {
  return str.split(" ")[0];
}

function compareStringsTolerantly(str1: string, str2: string): boolean {
  const firstWordOfStr1 = getFirstWord(str1);
  const firstWordOfStr2 = getFirstWord(str2);
  return (
    firstWordOfStr1.trim().toLowerCase() ===
    firstWordOfStr2.trim().toLowerCase()
  );
}

export async function getSpotifyTrackId(
  trackName: string,
  artistName: string,
  albumName: string,
  accessToken: string
): Promise<{ id: string; uri: string } | null> {
  try {
    const albumId = await getSpotifyAlbumId(albumName, artistName, accessToken);

    if (!albumId) {
      return null;
    }

    const response = await fetch(
      `${SPOTIFY_BASE_URL}/v1/albums/${albumId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Spotify API returned a ${response.status} status: ${response.statusText}`
      );
    }

    const { items, error } = await response.json();

    if (error) {
      throw new Error(error.message);
    }

    let foundTrack = null;
    for (let i = 0; i < items.length; i++) {
      if (compareStringsTolerantly(items[i].name, trackName)) {
        foundTrack = {
          id: items[i].id,
          uri: items[i].uri,
        };

        break;
      }
    }

    if (!foundTrack) {
      //  console.log("No se encontró el track con el nombre:", trackName);
    }

    return foundTrack;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(
        "Error al buscar el ID de la canción en Spotify:",
        err.message
      );
    } else {
      console.error("Ocurrió un error inesperado:", err);
    }
    return null;
  }
}

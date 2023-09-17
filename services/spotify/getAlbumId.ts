import { cleanInput } from '@/lib/stringUtils'; 


export async function getSpotifyAlbumId(
  albumName: string,
  artistName: string,
  accessToken: string
): Promise<string | null> {
  try {
    // Limpiar las entradas
    const cleanedAlbumName = cleanInput(albumName);
    const cleanedArtistName = cleanInput(artistName);

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=album:${cleanedAlbumName} artist:${cleanedArtistName}&type=album&offset=0&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
//    console.log("Spotify data:", data);

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.albums || data.albums.items.length === 0) {
      return null;
    }

    return data.albums.items[0].id;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(
        "Error al obtener el ID del álbum de Spotify:",
        err.message
      );
    } else {
      console.error("Ocurrió un error inesperado:", err);
    }
    return null;
  }
}

export async function getSpotifyAlbumId(
  albumName: string,
  artistName: string,
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=album:${albumName} artist:${artistName}&type=album`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("Respuesta de Spotify:", response); // NUEVO LOG

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Datos de Spotify:", data); // NUEVO LOG

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.albums || data.albums.items.length === 0) {
      console.log("No se encontraron álbumes para:", albumName, "por el artista:", artistName); // NUEVO LOG
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


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

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Spotify data:", data);

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

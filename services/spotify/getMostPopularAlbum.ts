const SPOTIFY_BASE_URL = "https://api.spotify.com";

export async function getMostPopularAlbum(
  artistName: string,
  accessToken: string
): Promise<string | null> {
  const response = await fetch(
    `${SPOTIFY_BASE_URL}/v1/search?q=${encodeURIComponent(
      artistName
    )}&type=artist&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  const artistId = data?.artists?.items[0]?.id;

  if (!artistId) return null;

  const albumsResponse = await fetch(
    `${SPOTIFY_BASE_URL}/v1/artists/${artistId}/albums?limit=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const albumsData = await albumsResponse.json();
  return albumsData?.items[0]?.id || null;
}

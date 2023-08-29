export async function fetchLastfmData(albumName: string, artistName?: string) {
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
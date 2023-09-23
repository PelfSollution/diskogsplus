
export async function fetchLastfmData(albumName: string, artistName?: string) {
  const apiKey = process.env.LASTFM_API_KEY;
  const baseUrl = "https://ws.audioscrobbler.com/2.0/?method=album.getinfo";
  const format = "&format=json";
  
  const url = `${baseUrl}&api_key=${apiKey}&album=${encodeURIComponent(albumName)}${
    artistName ? `&artist=${encodeURIComponent(artistName)}` : ""
  }${format}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch album info from Last.fm");
  }
  return response.json();
}

export async function fetchSimilarArtists(artistName: string, limit?: number, autocorrect?: number) {
  const apiKey = process.env.LASTFM_API_KEY;
  const baseUrl = "https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar";
  const format = "&format=json";
  
  const url = `${baseUrl}&api_key=${apiKey}&artist=${encodeURIComponent(artistName)}${
    limit ? `&limit=${limit}` : ""
  }${
    autocorrect ? `&autocorrect=${autocorrect}` : ""
  }${format}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch similar artists from Last.fm");
  }
  return response.json();
}

export async function fetchSimilarTracks(artistName: string, trackName: string, limit?: number, autocorrect?: number) {
  const apiKey = process.env.LASTFM_API_KEY;
  const baseUrl = "https://ws.audioscrobbler.com/2.0/?method=track.getsimilar";
  const format = "&format=json";
  
  const url = `${baseUrl}&api_key=${apiKey}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}${
    limit ? `&limit=${limit}` : ""
  }${
    autocorrect ? `&autocorrect=${autocorrect}` : ""
  }${format}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch similar tracks from Last.fm. Status: ${response.status} - ${response.statusText}`);

  }
  return response.json();
}

export async function fetchArtistInfo(artistName: string, autocorrect?: number) {
  const apiKey = process.env.LASTFM_API_KEY;
  const baseUrl = "https://ws.audioscrobbler.com/2.0/?method=artist.getinfo";
  const format = "&format=json";
  
  const url = `${baseUrl}&api_key=${apiKey}&artist=${encodeURIComponent(artistName)}${
    autocorrect ? `&autocorrect=${autocorrect}` : ""
  }${format}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch artist info from Last.fm");
  }
  return response.json();
}


export async function fetchLastfmData(albumName: string, artistName?: string) {
  const apiKey = process.env.LASTFM_API_KEY?.trim();
  if (!apiKey || !albumName) return null;

  try {
    const baseUrl = "https://ws.audioscrobbler.com/2.0/?method=album.getinfo&format=json";
    const url = `${baseUrl}&api_key=${apiKey}&album=${encodeURIComponent(albumName)}${
      artistName ? `&artist=${encodeURIComponent(artistName)}` : ""
    }`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchSimilarArtists(artistName: string, limit: number = 6, autocorrect: number = 1) {
  const apiKey = process.env.LASTFM_API_KEY?.trim();
  if (!apiKey || !artistName) return null;

  try {
    const baseUrl = "https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&format=json";
    const url = `${baseUrl}&api_key=${apiKey}&artist=${encodeURIComponent(artistName)}&limit=${limit}&autocorrect=${autocorrect}`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchSimilarTracks(artistName: string, trackName: string, limit: number = 6, autocorrect: number = 1) {
  const apiKey = process.env.LASTFM_API_KEY?.trim();
  if (!apiKey || !artistName || !trackName) return null;

  try {
    const baseUrl = "https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&format=json";
    const url = `${baseUrl}&api_key=${apiKey}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&limit=${limit}&autocorrect=${autocorrect}`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchArtistInfo(artistName: string, autocorrect: number = 1) {
  const apiKey = process.env.LASTFM_API_KEY?.trim();
  if (!apiKey || !artistName) return null;

  try {
    const baseUrl = "https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&format=json";
    const url = `${baseUrl}&api_key=${apiKey}&artist=${encodeURIComponent(artistName)}&autocorrect=${autocorrect}`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

import { getSongsFromSupabase } from '../supabase/getSongsFromSupabase';

const SPOTIFY_BASE_URL = "https://api.spotify.com";

export async function generateMixtape(spotifyToken: string, username: string): Promise<string> {
  try {
    // 1. Get the user's songs from Supabase
    const songs = await getSongsFromSupabase(username);

    // 2. Create a new playlist on Spotify
    const playlist = await createSpotifyPlaylist('Mi Mixtape [Diskogs +]', spotifyToken);

    if (!playlist.id) {
      throw new Error('Failed to create Spotify playlist');
    }

    // 3. Add songs to the new playlist
    const trackURIs = songs.map(s => `spotify:track:${s.spotifytrackid}`).filter(uri => uri !== "spotify:track:null");
    await addTracksToPlaylist(playlist.id, trackURIs, spotifyToken);
    

    // 4. Return the playlist embed URL
    return `https://open.spotify.com/embed/playlist/${playlist.id}`;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error generating Spotify mixtape:", err.message);
    } else {
      console.error("An unexpected error occurred:", err);
    }
    throw err;
  }
}


async function getSpotifyUserId(accessToken: string): Promise<string> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/v1/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Spotify API returned a ${response.status} status: ${data.error?.message || 'Unknown error'}`);
  }

  return data.id;
}

async function createSpotifyPlaylist(name: string, accessToken: string): Promise<{ id: string }> {
  const userId = await getSpotifyUserId(accessToken);
  
  const response = await fetch(`${SPOTIFY_BASE_URL}/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, public: true })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Spotify API returned a ${response.status} status: ${data.error?.message || 'Unknown error'}`);
  }

  return data;
}

async function addTracksToPlaylist(playlistId: string, trackUris: string[], accessToken: string) {
  const response = await fetch(`${SPOTIFY_BASE_URL}/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris: trackUris })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Spotify API returned a ${response.status} status: ${data.error?.message || 'Unknown error'}`);
  }
}

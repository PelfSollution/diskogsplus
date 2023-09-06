interface SpotifyAudioFeatures {
  // Clave musical del track. Los valores posibles varían desde -1 a 11
  // 0 = C, 1 = C♯/D♭, 2 = D, etc. Si no se detecta clave, el valor es -1.
  key: number;
  // El tempo estimado general de un track en BPM.
  // Deriva directamente de la duración promedio del beat.
  tempo: number;
}

const SPOTIFY_BASE_URL = "https://api.spotify.com";

export async function getTrackAudioFeatures(
  trackId: string,
  accessToken: string
): Promise<SpotifyAudioFeatures | null> {
  try {
    const response = await fetch(
      `${SPOTIFY_BASE_URL}/v1/audio-features/${trackId}`,
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

    const { key, tempo, error } = await response.json();

    if (error) {
      throw new Error(error.message);
    }

    return { key, tempo };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(
        "Error al obtener las características del audio de Spotify:",
        err.message
      );
    } else {
      console.error("Ocurrió un error inesperado:", err);
    }
    return null;
  }
}

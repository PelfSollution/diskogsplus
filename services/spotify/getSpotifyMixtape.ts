import { getSongsFromSupabase } from '../supabase/getSongsFromSupabase';
import { normalizeForMatch, versionTag } from '../audioFeatures/getTrackAudioFeatures';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";
const ADD_ITEMS_BATCH = 100; // máximo de POST /playlists/{id}/items
const SEARCH_CONCURRENCY = 3;

export type SpotifyExportResult = {
  playlistId: string;
  url: string;
  added: number;
  total: number;
};

/** Error de Spotify con su código HTTP, para explicarlo al usuario. */
export class SpotifyApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function spotifyFetch(path: string, accessToken: string, init: RequestInit = {}): Promise<any> {
  const response = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new SpotifyApiError(response.status, data?.error?.message || `Spotify respondió con ${response.status}`);
  }
  return data;
}

/**
 * Busca la pista en Spotify. Solo acepta el mismo título (y la misma versión:
 * un remix no vale por el original) de un artista que coincida.
 */
async function searchTrackId(title: string, artist: string, accessToken: string): Promise<string | null> {
  const query = `track:${title.replace(/["()[\]]/g, ' ')} artist:${artist.replace(/["()[\]]/g, ' ')}`;
  // Desde febrero de 2026 la búsqueda devuelve como máximo 10 resultados
  const data = await spotifyFetch(`/search?type=track&limit=10&q=${encodeURIComponent(query)}`, accessToken);
  const items: any[] = data?.tracks?.items || [];
  const wantedTitle = normalizeForMatch(title);
  const wantedVersion = versionTag(title);
  const wantedArtist = normalizeForMatch(artist);
  const match = items.find(
    (t) =>
      normalizeForMatch(t?.name) === wantedTitle &&
      versionTag(t?.name || '') === wantedVersion &&
      (t?.artists || []).some((a: any) => {
        const name = normalizeForMatch(a?.name);
        return name && (name === wantedArtist || name.includes(wantedArtist) || wantedArtist.includes(name));
      })
  );
  return match?.id ?? null;
}

/**
 * Crea en Spotify una playlist privada con las pistas de la mixtape, en el
 * orden de la sesión. Las pistas sin ID de Spotify se buscan y el ID
 * encontrado se guarda para la próxima vez.
 */
export async function generateMixtape(
  spotifyToken: string,
  username: string,
  mixtape?: { id: number; nombre: string }
): Promise<SpotifyExportResult> {
  const songs = await getSongsFromSupabase(username, mixtape?.id);

  // ID de Spotify de cada pista, buscando las que no lo tienen
  const ids: (string | null)[] = songs.map((s) => s.spotifytrackid || null);
  const pending = songs.map((s, i) => ({ s, i })).filter(({ s }) => !s.spotifytrackid);
  let next = 0;
  async function worker() {
    while (next < pending.length) {
      const { s, i } = pending[next++];
      try {
        const found = await searchTrackId(s.trackname, s.artista, spotifyToken);
        ids[i] = found;
        if (found && isSupabaseConfigured) {
          await supabase.from('mixtape').update({ spotifytrackid: found }).eq('id', s.id).eq('username', username);
        }
      } catch (err) {
        // Un permiso denegado afecta a todas: se para la exportación
        if (err instanceof SpotifyApiError && (err.status === 401 || err.status === 403)) throw err;
        console.warn(`[Spotify] No se pudo buscar «${s.trackname}»:`, (err as Error).message);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(SEARCH_CONCURRENCY, pending.length) }, worker));

  const uris = ids.filter((id): id is string => Boolean(id)).map((id) => `spotify:track:${id}`);

  const playlist = await spotifyFetch('/me/playlists', spotifyToken, {
    method: 'POST',
    body: JSON.stringify({
      name: mixtape?.nombre || 'Mi mixtape',
      description: `Mixtape de Diskogs+ · ${uris.length} de ${songs.length} pistas`,
      public: false,
    }),
  });
  if (!playlist?.id) throw new Error('Spotify no devolvió la playlist creada');

  for (let i = 0; i < uris.length; i += ADD_ITEMS_BATCH) {
    await spotifyFetch(`/playlists/${playlist.id}/items`, spotifyToken, {
      method: 'POST',
      body: JSON.stringify({ uris: uris.slice(i, i + ADD_ITEMS_BATCH) }),
    });
  }

  return {
    playlistId: playlist.id,
    url: playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`,
    added: uris.length,
    total: songs.length,
  };
}

export type LocalMixtapeTrack = {
  id?: number | string;
  username: string;
  mixtape_id?: number | null; // solo en Supabase; en local hay una sola lista
  artista: string;
  trackname: string;
  disco_id: string;
  spotifytrackid?: string | null;
  tempo?: number | null;
  key?: number | null;
  mode?: number | null;
  duration?: string | null;
  vinyl_position?: string | null; // posición en Discogs: «A1», «B2»
  data_checked_at?: string | null; // solo en Supabase: última búsqueda de datos
  album?: string | null;
  cover_url?: string | null;
};

const STORAGE_PREFIX = "diskogs_mixtape_";

export function getLocalMixtape(username: string): LocalMixtapeTrack[] {
  if (typeof window === "undefined" || !username) return [];

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${username}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[MixtapeStorage] Error leyendo de localStorage:", err);
    return [];
  }
}

export function saveLocalMixtape(track: LocalMixtapeTrack): LocalMixtapeTrack[] {
  if (typeof window === "undefined" || !track.username) return [];

  try {
    const current = getLocalMixtape(track.username);
    // Evitar duplicados
    const exists = current.some(
      (t) =>
        t.artista.toLowerCase() === track.artista.toLowerCase() &&
        t.trackname.toLowerCase() === track.trackname.toLowerCase() &&
        t.disco_id === track.disco_id
    );

    if (!exists) {
      const newTrack = {
        ...track,
        id: track.id || Date.now(),
      };
      // Al final, como en Supabase: la lista sigue el orden de la sesión
      const updated = [...current, newTrack];
      localStorage.setItem(`${STORAGE_PREFIX}${track.username}`, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch (err) {
    console.warn("[MixtapeStorage] Error guardando en localStorage:", err);
    return [];
  }
}

export function removeLocalMixtape(
  username: string,
  artista: string,
  trackname: string,
  disco_id: string
): LocalMixtapeTrack[] {
  if (typeof window === "undefined" || !username) return [];

  try {
    const current = getLocalMixtape(username);
    const updated = current.filter(
      (t) =>
        !(
          t.artista.toLowerCase() === artista.toLowerCase() &&
          t.trackname.toLowerCase() === trackname.toLowerCase() &&
          t.disco_id === disco_id
        )
    );
    localStorage.setItem(`${STORAGE_PREFIX}${username}`, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("[MixtapeStorage] Error eliminando de localStorage:", err);
    return [];
  }
}

/** Guarda la lista local en el orden indicado (reordenar la sesión). */
export function reorderLocalMixtape(
  username: string,
  tracks: LocalMixtapeTrack[]
): LocalMixtapeTrack[] {
  if (typeof window === "undefined" || !username) return [];

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${username}`, JSON.stringify(tracks));
    return tracks;
  } catch (err) {
    console.warn("[MixtapeStorage] Error reordenando en localStorage:", err);
    return [];
  }
}

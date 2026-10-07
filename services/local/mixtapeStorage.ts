export type LocalMixtapeTrack = {
  id?: number | string;
  username: string;
  artista: string;
  trackname: string;
  disco_id: string;
  spotifytrackid?: string | null;
  tempo?: number | null;
  key?: number | null;
  mode?: number | null;
  duration?: string | null;
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
      const updated = [newTrack, ...current];
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

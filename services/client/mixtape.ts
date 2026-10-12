// Mixtape desde el navegador: rutas /api/mixtape + copia en localStorage.
// Si Supabase no está configurado (503) o falla, la app sigue con localStorage.
import {
  getLocalMixtape,
  saveLocalMixtape,
  removeLocalMixtape,
  LocalMixtapeTrack,
} from "../local/mixtapeStorage";

export type Mixtape = LocalMixtapeTrack;

export async function getMixtape(username: string): Promise<LocalMixtapeTrack[]> {
  if (!username) return [];

  try {
    const res = await fetch("/api/mixtape");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("[Mixtape] Servidor no disponible, usando almacenamiento local:", err);
  }

  return getLocalMixtape(username);
}

export async function addMixtape(track: Mixtape) {
  // 1. Guardar siempre en local para disponibilidad inmediata
  saveLocalMixtape(track);

  // 2. Sincronizar con el servidor
  try {
    const res = await fetch("/api/mixtape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(track),
    });
    if (!res.ok && res.status !== 503) {
      console.warn("[Mixtape] Aviso al sincronizar con el servidor:", res.status);
    }
  } catch (err) {
    console.warn("[Mixtape] Excepción al sincronizar con el servidor:", err);
  }

  return [track];
}

export async function deleteFromMixtape(
  username: string,
  artista: string,
  trackname: string,
  disco_id: string
): Promise<void> {
  // 1. Eliminar siempre de local
  removeLocalMixtape(username, artista, trackname, disco_id);

  // 2. Sincronizar el borrado
  try {
    const res = await fetch("/api/mixtape", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artista, trackname, disco_id }),
    });
    if (!res.ok && res.status !== 503) {
      console.warn("[Mixtape] Error eliminando en el servidor:", res.status);
    }
  } catch (err) {
    console.warn("[Mixtape] Excepción eliminando en el servidor:", err);
  }
}

export default getMixtape;

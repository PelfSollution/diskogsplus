// Mixtapes desde el navegador: rutas /api/mixtapes y /api/mixtape.
// Si Supabase no está configurado (503) o el servidor no responde, la app
// usa una sola lista en localStorage (mixtapeId null).
import {
  getLocalMixtape,
  saveLocalMixtape,
  removeLocalMixtape,
  reorderLocalMixtape,
  LocalMixtapeTrack,
} from "../local/mixtapeStorage";
import type { MixtapeInfo } from "../supabase/mixtapes";

export type Mixtape = LocalMixtapeTrack;
export type { MixtapeInfo };

/** Respuesta que obliga a usar localStorage: sin Supabase o sin servidor. */
function isOffline(res: Response | null): boolean {
  return res === null || res.status === 503;
}

async function send(url: string, method: string, body?: unknown): Promise<Response | null> {
  try {
    return await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.warn(`[Mixtape] Servidor no disponible (${method} ${url}):`, err);
    return null;
  }
}

async function errorMessage(res: Response | null, fallback: string): Promise<string> {
  try {
    return (await res?.json())?.error || fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Mixtapes
// ---------------------------------------------------------------------------

/** Mixtapes del usuario, o null si hay que usar la lista local. */
export async function getMixtapes(): Promise<MixtapeInfo[] | null> {
  const res = await send("/api/mixtapes", "GET");
  if (isOffline(res) || !res!.ok) return null;
  return res!.json();
}

/** Crea una mixtape. Devuelve la mixtape o el mensaje de error. */
export async function createMixtape(nombre: string): Promise<MixtapeInfo | string> {
  const res = await send("/api/mixtapes", "POST", { nombre });
  if (!res?.ok) return errorMessage(res, "No se pudo crear la mixtape.");
  return res.json();
}

/** Renombra una mixtape. Devuelve null si va bien o el mensaje de error. */
export async function renameMixtape(id: number, nombre: string): Promise<string | null> {
  const res = await send("/api/mixtapes", "PATCH", { id, nombre });
  return res?.ok ? null : errorMessage(res, "No se pudo renombrar la mixtape.");
}

export async function deleteMixtape(id: number): Promise<boolean> {
  const res = await send("/api/mixtapes", "DELETE", { id });
  return Boolean(res?.ok);
}

// ---------------------------------------------------------------------------
// Pistas
// ---------------------------------------------------------------------------

export async function getMixtape(
  username: string,
  mixtapeId: number | null
): Promise<LocalMixtapeTrack[]> {
  if (!username) return [];
  if (mixtapeId === null) return getLocalMixtape(username);

  const res = await send(`/api/mixtape?mixtape_id=${mixtapeId}`, "GET");
  if (isOffline(res)) return getLocalMixtape(username);
  if (!res!.ok) throw new Error(await errorMessage(res, "No se pudo cargar la mixtape."));
  return res!.json();
}

export async function addMixtape(track: Mixtape): Promise<void> {
  if (track.mixtape_id == null) {
    saveLocalMixtape(track);
    return;
  }

  const res = await send("/api/mixtape", "POST", track);
  if (isOffline(res)) {
    saveLocalMixtape(track);
    return;
  }
  if (!res!.ok) throw new Error(await errorMessage(res, "No se pudo añadir la pista."));
}

export async function deleteFromMixtape(
  username: string,
  mixtapeId: number | null,
  artista: string,
  trackname: string,
  disco_id: string
): Promise<void> {
  if (mixtapeId === null) {
    removeLocalMixtape(username, artista, trackname, disco_id);
    return;
  }

  const res = await send("/api/mixtape", "DELETE", {
    mixtape_id: mixtapeId,
    artista,
    trackname,
    disco_id,
  });
  if (isOffline(res)) {
    removeLocalMixtape(username, artista, trackname, disco_id);
    return;
  }
  if (!res!.ok) throw new Error(await errorMessage(res, "No se pudo quitar la pista."));
}

/** Guarda el orden nuevo de las pistas (lista completa, ya ordenada). */
export async function reorderMixtape(
  username: string,
  mixtapeId: number | null,
  tracks: LocalMixtapeTrack[]
): Promise<void> {
  if (mixtapeId === null) {
    reorderLocalMixtape(username, tracks);
    return;
  }

  const res = await send("/api/mixtape", "PATCH", {
    mixtape_id: mixtapeId,
    track_ids: tracks.map((t) => Number(t.id)),
  });
  if (isOffline(res)) {
    reorderLocalMixtape(username, tracks);
    return;
  }
  if (!res!.ok) throw new Error(await errorMessage(res, "No se pudo guardar el orden."));
}

/** Completa posición en el vinilo, BPM y tonalidad de las pistas que no los tienen. Solo con Supabase. */
export async function completeMixtapeTracks(
  mixtapeId: number
): Promise<{ revisadas: number; actualizadas: number }> {
  const res = await send("/api/mixtape/completeTracks", "POST", { mixtape_id: mixtapeId });
  if (!res?.ok) throw new Error(await errorMessage(res, "No se pudieron buscar los datos."));
  return res.json();
}

/** Enlace a DiscBOT para analizar una mixtape (el historial se guarda por nombre). */
export function mixtapeChatHref(
  username: string,
  mixtapeId: number | null | undefined,
  nombre: string
): string {
  const params = new URLSearchParams({ username, artista: "Mixtape", album: nombre });
  if (mixtapeId != null) params.set("mixtape_id", String(mixtapeId));
  return `/chat?${params.toString()}`;
}

export default getMixtape;

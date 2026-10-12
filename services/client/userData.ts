// Datos del usuario desde el navegador. Todo pasa por rutas API que toman el
// usuario de la sesión: el navegador no accede a Supabase directamente.
import type { WantlistEntry } from "../supabase/getWantlistItemsUser";
import type { ChatLog } from "../supabase/getChatLogsUser";

async function getJSON<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`Aviso consultando ${url}:`, err);
    return fallback;
  }
}

export function getWantlist(): Promise<WantlistEntry[]> {
  return getJSON("/api/albums/wantlist", []);
}

export async function isAlbumInWantlist(disco_id: number): Promise<boolean> {
  const data = await getJSON<{ inWantlist?: boolean }>(
    `/api/albums/wantlist?disco_id=${disco_id}`,
    {}
  );
  return Boolean(data.inWantlist);
}

export async function getArtistImage(artista: string): Promise<string | null> {
  const data = await getJSON<{ imageUrl?: string | null }>(
    `/api/albums/artistImage?${new URLSearchParams({ artista })}`,
    {}
  );
  return data.imageUrl || null;
}

/** Discos sobre los que el usuario ha hablado con DiscBOT. */
export function getChatAlbums(): Promise<ChatLog[]> {
  return getJSON("/api/chatLogs", []);
}

/** Conversación con DiscBOT sobre un disco. */
export function getChatHistory(artista: string, album: string): Promise<any[]> {
  return getJSON(`/api/chatLogs?${new URLSearchParams({ artista, album })}`, []);
}

export function getMixtapeURLs(): Promise<{ mixtape_url: string }[]> {
  return getJSON("/api/mixtapeUrls", []);
}

export async function deleteApiKey(): Promise<boolean> {
  try {
    const res = await fetch("/api/deleteApiKey", { method: "POST" });
    return res.ok;
  } catch (err) {
    console.error("Error eliminando la clave API:", err);
    return false;
  }
}

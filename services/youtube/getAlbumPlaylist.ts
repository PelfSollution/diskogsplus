import { fetchDiscogsRelease } from "../discogs/fetchRelease";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/**
 * Lista de reproducción de un disco, pista a pista y en el orden del tracklist:
 *   1. Vídeos que Discogs enlaza en el release (gratis, sin clave).
 *   2. Pistas oficiales de los canales «Artista - Topic» de YouTube para las que
 *      falten (YOUTUBE_API_KEY, 1 búsqueda = 100 unidades de cuota por disco).
 *   3. Si aún falta más de la mitad, un vídeo «full album» de duración similar.
 *   4. Preview de 30 s de Deezer para las pistas sin vídeo (sin clave).
 * Los vídeos se cachean en memoria y, si Supabase está configurado, en la tabla
 * `album_playlists` para no volver a gastar cuota de YouTube. Las previews de
 * Deezer no se guardan: sus URLs caducan en unas horas.
 *
 * (El embed de YouTube por búsqueda, `listType=search`, dejó de funcionar en 2020.)
 */

export type PlaylistSource = "discogs" | "youtube" | "deezer";

export interface PlaylistTrack {
  position: string;
  title: string;
  duration: string;
  videoId: string | null;
  preview: string | null;
  source: PlaylistSource | null;
}

export interface AlbumPlaylist {
  discoId: string;
  artist: string;
  album: string;
  tracks: PlaylistTrack[];
  /** Vídeo con el disco entero, solo si las pistas sueltas cubren menos de la mitad */
  fullAlbum: { videoId: string; title: string } | null;
  /** Vídeos de Discogs que no corresponden a ninguna pista (directos, entrevistas…) */
  extraVideos: { videoId: string; title: string }[];
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const DB_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const memoryCache = new Map<string, { playlist: AlbumPlaylist; expiresAt: number }>();

/** Minúsculas, sin acentos, sin paréntesis/corchetes ni puntuación. */
export function normalize(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^the /, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function youtubeIdFromUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const match =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * 2 = el título del vídeo (o una de sus partes separadas por " - ") es la pista.
 * 1 = el título contiene el nombre de la pista como palabras completas.
 * 0 = no coincide.
 */
export function matchScore(videoTitle: string, trackTitle: string): number {
  const track = normalize(trackTitle);
  if (!track) return 0;
  const parts = (videoTitle || "").split(/\s[-–—]\s/).map(normalize);
  if (parts.some((part) => part === track)) return 2;
  const whole = ` ${normalize((videoTitle || "").replace(/\s[-–—]\s/g, " "))} `;
  return whole.includes(` ${track} `) ? 1 : 0;
}

/** "Artista (2)" → "Artista" (Discogs numera los homónimos) */
function cleanArtist(name: string): string {
  return (name || "").replace(/\s\(\d+\)$/, "").replace(/\*$/, "").trim();
}

/** "4:05" → 245 s */
function parseDuration(duration: string): number {
  const parts = (duration || "").split(":").map(Number);
  if (!parts.length || parts.some(isNaN)) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** "PT1H2M3S" → 3723 s */
function parseIsoDuration(iso: string): number {
  const m = (iso || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
}

/** Asigna a cada pista sin vídeo el candidato que mejor coincide (cada candidato una vez) */
function assignVideos(
  tracks: PlaylistTrack[],
  candidates: { videoId: string; title: string }[],
  source: PlaylistSource
): Set<string> {
  const used = new Set<string>();
  for (const track of tracks) {
    if (track.videoId) continue;
    let best: { videoId: string; score: number } | null = null;
    for (const c of candidates) {
      if (used.has(c.videoId)) continue;
      const score = matchScore(c.title, track.title);
      if (score > (best?.score ?? 0)) best = { videoId: c.videoId, score };
      if (score === 2) break;
    }
    if (best) {
      track.videoId = best.videoId;
      track.source = source;
      used.add(best.videoId);
    }
  }
  return used;
}

async function youtubeApi(path: string, params: Record<string, string>): Promise<any | null> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return null;
  const query = new URLSearchParams({ ...params, key });
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${query}`);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.warn(`[YouTube] ${path} respondió ${res.status}:`, body?.error?.message);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`[YouTube] Error en ${path}:`, err?.message);
    return null;
  }
}

/** Pistas oficiales (canal «Artista - Topic») y vídeos «full album» del disco */
async function searchYouTube(artist: string, album: string, isVarious: boolean) {
  const search = await youtubeApi("search", {
    part: "snippet",
    type: "video",
    maxResults: "50",
    q: isVarious ? album : `${artist} ${album}`,
  });
  if (!search) return null; // sin clave, sin cuota o error: no cachear el resultado
  const items: any[] = search.items || [];
  if (!items.length) return { topic: [], fullAlbum: [] };

  const ids = items.map((i) => i.id?.videoId).filter(Boolean);
  const details = await youtubeApi("videos", {
    part: "status,contentDetails",
    id: ids.join(","),
  });
  const info = new Map<string, any>((details?.items || []).map((v: any) => [v.id, v]));
  const embeddable = (id: string) => info.get(id)?.status?.embeddable === true;

  const artistKey = normalize(artist).replace(/ /g, "");
  const topic = items
    .filter((i) => {
      const channel: string = i.snippet?.channelTitle || "";
      if (!channel.endsWith("- Topic") || !embeddable(i.id.videoId)) return false;
      if (isVarious) return true;
      const channelKey = normalize(channel.replace(/- Topic$/, "")).replace(/ /g, "");
      return channelKey.includes(artistKey) || artistKey.includes(channelKey);
    })
    .map((i) => ({ videoId: i.id.videoId as string, title: decodeHtml(i.snippet.title) }));

  const albumKey = normalize(album);
  const fullAlbum = items
    .filter((i) => {
      const title = normalize(decodeHtml(i.snippet?.title || ""));
      return /full (album|ep|lp)/.test(title) && title.includes(albumKey) && embeddable(i.id.videoId);
    })
    .map((i) => ({
      videoId: i.id.videoId as string,
      title: decodeHtml(i.snippet.title),
      seconds: parseIsoDuration(info.get(i.id.videoId)?.contentDetails?.duration),
    }));

  return { topic, fullAlbum };
}

function decodeHtml(str: string): string {
  return (str || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Previews de 30 s de Deezer para las pistas que siguen sin vídeo */
async function addDeezerPreviews(tracks: PlaylistTrack[], artist: string, album: string, isVarious: boolean) {
  const q = isVarious ? `album:"${album}"` : `artist:"${artist}" album:"${album}"`;
  try {
    const search = await fetch(`https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=1`);
    const albumId = (await search.json())?.data?.[0]?.id;
    if (!albumId) return;
    const res = await fetch(`https://api.deezer.com/album/${albumId}/tracks?limit=100`);
    const deezerTracks: any[] = (await res.json())?.data || [];
    for (const track of tracks) {
      if (track.videoId) continue;
      const hit = deezerTracks.find((d) => d.preview && matchScore(d.title, track.title) > 0);
      if (hit) {
        track.preview = hit.preview;
        track.source = "deezer";
      }
    }
  } catch (err: any) {
    console.warn("[Deezer] No se pudieron obtener las previews:", err?.message);
  }
}

async function readDbCache(discoId: string): Promise<AlbumPlaylist | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from("album_playlists")
      .select("playlist, updated_at")
      .eq("disco_id", discoId)
      .maybeSingle();
    if (!data) return null;
    if (Date.now() - new Date(data.updated_at).getTime() > DB_CACHE_TTL_MS) return null;
    return data.playlist as AlbumPlaylist;
  } catch {
    return null;
  }
}

async function writeDbCache(playlist: AlbumPlaylist) {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("album_playlists").upsert({
      disco_id: playlist.discoId,
      playlist,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn("[Playlist] No se pudo guardar en Supabase:", error.message);
  } catch {
    // la caché en Supabase es opcional
  }
}

/** Devuelve la lista sin previews y si se puede guardar en Supabase */
async function buildPlaylist(discoId: string): Promise<{ playlist: AlbumPlaylist; cacheable: boolean }> {
  const release = await fetchDiscogsRelease(discoId, null);
  const artist = cleanArtist(release?.artists?.[0]?.name || "");
  const album = release?.title || "";
  const isVarious = /^various$/i.test(artist);

  const tracks: PlaylistTrack[] = (Array.isArray(release?.tracklist) ? release.tracklist : [])
    .filter((t: any) => t.type_ === "track" && t.title)
    .map((t: any) => ({
      position: t.position || "",
      title: t.title,
      duration: t.duration || "",
      videoId: null,
      preview: null,
      source: null,
    }));

  // 1. Vídeos de Discogs
  const discogsVideos = (Array.isArray(release?.videos) ? release.videos : [])
    .map((v: any) => ({ videoId: youtubeIdFromUrl(v.uri), title: v.title || "" }))
    .filter((v: any): v is { videoId: string; title: string } => Boolean(v.videoId));
  const usedDiscogs = assignVideos(tracks, discogsVideos, "discogs");

  // 2 y 3. YouTube (solo si faltan pistas y hay clave)
  let fullAlbum: AlbumPlaylist["fullAlbum"] = null;
  let cacheable = true;
  if (tracks.some((t) => !t.videoId) && artist && album) {
    const yt = await searchYouTube(artist, album, isVarious);
    if (!yt) cacheable = false;
    else assignVideos(tracks, yt.topic, "youtube");

    const covered = tracks.filter((t) => t.videoId).length;
    if (yt?.fullAlbum.length && covered < tracks.length / 2) {
      const albumSeconds = tracks.reduce((acc, t) => acc + parseDuration(t.duration), 0);
      const candidate = yt.fullAlbum.find(
        (v) => !albumSeconds || !v.seconds || Math.abs(v.seconds - albumSeconds) <= albumSeconds * 0.25
      );
      if (candidate) fullAlbum = { videoId: candidate.videoId, title: candidate.title };
    }
  }

  const playlist: AlbumPlaylist = {
    discoId,
    artist,
    album,
    tracks,
    fullAlbum,
    extraVideos: discogsVideos.filter((v: { videoId: string }) => !usedDiscogs.has(v.videoId)),
  };
  return { playlist, cacheable };
}

export async function getAlbumPlaylist(discoId: string): Promise<AlbumPlaylist> {
  const cached = memoryCache.get(discoId);
  if (cached && cached.expiresAt > Date.now()) return cached.playlist;

  let playlist = await readDbCache(discoId);
  if (!playlist) {
    const built = await buildPlaylist(discoId);
    playlist = built.playlist;
    if (built.cacheable) await writeDbCache(playlist);
  }

  // 4. Deezer (después de la caché, porque las URLs de preview caducan)
  if (playlist.tracks.some((t) => !t.videoId) && playlist.album) {
    playlist = { ...playlist, tracks: playlist.tracks.map((t) => ({ ...t, preview: null })) };
    await addDeezerPreviews(playlist.tracks, playlist.artist, playlist.album, /^various$/i.test(playlist.artist));
  }
  memoryCache.set(discoId, { playlist, expiresAt: Date.now() + CACHE_TTL_MS });
  return playlist;
}

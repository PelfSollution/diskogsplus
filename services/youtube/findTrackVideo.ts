import { fetchDiscogsRelease } from "../discogs/fetchRelease";

/**
 * Busca el vídeo de YouTube de una pista entre los vídeos que Discogs tiene
 * enlazados en el release. Gratis y sin clave.
 *
 * (El embed de YouTube por búsqueda, `listType=search`, dejó de funcionar en 2020.)
 */

export interface TrackVideo {
  videoId: string;
  title: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const releaseVideosCache = new Map<string, { videos: any[]; expiresAt: number }>();

/** Minúsculas, sin acentos, sin paréntesis/corchetes ni puntuación. */
function normalize(str: string): string {
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
function matchScore(videoTitle: string, trackTitle: string): number {
  const track = normalize(trackTitle);
  if (!track) return 0;
  const parts = (videoTitle || "").split(/\s[-–—]\s/).map(normalize);
  if (parts.some((part) => part === track)) return 2;
  const whole = ` ${normalize((videoTitle || "").replace(/\s[-–—]\s/g, " "))} `;
  return whole.includes(` ${track} `) ? 1 : 0;
}

async function getReleaseVideos(discoId: string): Promise<any[]> {
  const cached = releaseVideosCache.get(discoId);
  if (cached && cached.expiresAt > Date.now()) return cached.videos;

  let videos: any[] = [];
  try {
    const release = await fetchDiscogsRelease(discoId, null);
    videos = Array.isArray(release?.videos) ? release.videos : [];
  } catch (err: any) {
    console.warn("[YouTube] No se pudieron obtener los vídeos de Discogs:", err?.message);
  }
  releaseVideosCache.set(discoId, { videos, expiresAt: Date.now() + CACHE_TTL_MS });
  return videos;
}

export async function findTrackVideo(
  discoId: string,
  trackTitle: string
): Promise<TrackVideo | null> {
  if (!discoId || !trackTitle) return null;

  const videos = await getReleaseVideos(discoId);
  let best: { video: any; score: number } | null = null;
  for (const video of videos) {
    const score = matchScore(video?.title, trackTitle);
    if (score > (best?.score ?? 0)) best = { video, score };
    if (score === 2) break;
  }

  const videoId = best ? youtubeIdFromUrl(best.video.uri) : null;
  return videoId ? { videoId, title: best!.video.title || trackTitle } : null;
}

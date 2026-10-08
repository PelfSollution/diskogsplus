import { getAlbumPlaylist, matchScore } from "./getAlbumPlaylist";

/**
 * Busca cómo reproducir una pista del mixtape a partir de la lista del disco
 * (vídeos de Discogs → pistas oficiales de YouTube → preview de Deezer).
 */

export interface TrackVideo {
  videoId: string | null;
  preview: string | null;
  title: string;
}

export async function findTrackVideo(
  discoId: string,
  trackTitle: string
): Promise<TrackVideo | null> {
  if (!discoId || !trackTitle) return null;

  let playlist;
  try {
    playlist = await getAlbumPlaylist(discoId);
  } catch (err: any) {
    console.warn("[YouTube] No se pudo obtener la lista del disco:", err?.message);
    return null;
  }

  let best: { track: (typeof playlist.tracks)[number]; score: number } | null = null;
  for (const track of playlist.tracks) {
    const score = matchScore(track.title, trackTitle);
    if (score > (best?.score ?? 0)) best = { track, score };
    if (score === 2) break;
  }
  if (best && (best.track.videoId || best.track.preview)) {
    return { videoId: best.track.videoId, preview: best.track.preview, title: best.track.title };
  }

  // Pista que no está en el tracklist (p. ej. una versión): probar con los vídeos sueltos
  const extra = playlist.extraVideos.find((v) => matchScore(v.title, trackTitle) > 0);
  return extra ? { videoId: extra.videoId, preview: null, title: extra.title } : null;
}

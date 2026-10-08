import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import useTrackPlayer from "@/hooks/useTrackPlayer";
import type { AlbumPlaylist, PlaylistTrack } from "@/services/youtube/getAlbumPlaylist";

/**
 * Estado del reproductor de un disco, compartido entre el tracklist (botón de
 * play en cada pista) y la tarjeta del reproductor (vídeo y controles).
 */

interface VideoItem {
  uri: string;
  title?: string;
}

type Selection =
  | { kind: "track"; index: number }
  | { kind: "video"; videoId: string; title: string };

const jsonFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

function youtubeIdFromUrl(url: string): string | null {
  const match =
    url?.match(/[?&]v=([A-Za-z0-9_-]{11})/) || url?.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function trackKey(position: string | undefined, title: string): string {
  return `${(position || "").trim().toUpperCase()}|${(title || "").trim().toLowerCase()}`;
}

export default function useAlbumPlayer(discoId: number, videos: VideoItem[] = []) {
  // Lista del disco: vídeos de Discogs + pistas oficiales de YouTube + previews de Deezer
  const { data, error, isLoading } = useSWR<{ playlist: AlbumPlaylist }>(
    discoId ? `/api/albums/playlist?disco_id=${discoId}` : null,
    jsonFetcher,
    { revalidateOnFocus: false }
  );
  const playlist = data?.playlist;
  const tracks = useMemo(() => playlist?.tracks ?? [], [playlist]);

  // Si falla la API, al menos los vídeos que Discogs enlaza
  const extraVideos = useMemo(() => {
    if (playlist) return playlist.extraVideos;
    if (!error) return [];
    return videos
      .map((v) => ({ videoId: youtubeIdFromUrl(v.uri), title: v.title || "" }))
      .filter((v): v is { videoId: string; title: string } => Boolean(v.videoId));
  }, [playlist, error, videos]);

  const [selected, setSelected] = useState<Selection | null>(null);
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const isPlayable = useCallback(
    (i: number) => Boolean((tracks[i]?.videoId || tracks[i]?.preview) && !failed.has(i)),
    [tracks, failed]
  );

  // Hasta que el usuario elija, la primera pista disponible (o el disco completo)
  const initial = useMemo<Selection | null>(() => {
    if (!playlist) return null;
    const first = playlist.tracks.findIndex((t) => t.videoId || t.preview);
    if (first >= 0) return { kind: "track", index: first };
    const video = playlist.fullAlbum ?? playlist.extraVideos[0];
    return video ? { kind: "video", ...video } : null;
  }, [playlist]);
  const current = selected ?? initial;
  const currentIndex = current?.kind === "track" ? current.index : -1;

  const findPlayable = useCallback(
    (from: number, step: 1 | -1) => {
      for (let i = from; i >= 0 && i < tracks.length; i += step) {
        if (isPlayable(i)) return i;
      }
      return -1;
    },
    [tracks, isPlayable]
  );

  const { containerRef, load, play, pause, toggle, isPlaying, mode } = useTrackPlayer({
    onEnded: () => goTo(findPlayable(currentIndex + 1, 1)),
    onError: () => {
      if (currentIndex < 0) return;
      const track = tracks[currentIndex];
      // Vídeo bloqueado fuera de YouTube: probar la preview de Deezer o saltar
      if (track?.videoId && track.preview) {
        load({ preview: track.preview });
        return;
      }
      setFailed((prev) => new Set(prev).add(currentIndex));
      goTo(findPlayable(currentIndex + 1, 1));
    },
  });

  function goTo(index: number, autoplay = true) {
    if (index < 0) return;
    setSelected({ kind: "track", index });
    load(tracks[index], autoplay);
  }

  function playVideo(videoId: string, title: string) {
    setSelected({ kind: "video", videoId, title });
    load({ videoId });
  }

  /** Play/pausa de una pista concreta (botón del tracklist) */
  function toggleTrack(index: number) {
    if (index === currentIndex && mode) {
      toggle();
    } else {
      goTo(index);
    }
  }

  // Al llegar la lista, dejar preparada la primera pista disponible (sin reproducir)
  useEffect(() => {
    if (!playlist || !initial) return;
    load(
      initial.kind === "track" ? playlist.tracks[initial.index] : { videoId: initial.videoId },
      false
    );
  }, [playlist, initial, load]);

  // Índice de la lista por posición y título, para cruzarla con el tracklist de la ficha
  const indexByKey = useMemo(() => {
    const map = new Map<string, number>();
    tracks.forEach((t, i) => {
      map.set(trackKey(t.position, t.title), i);
      if (!map.has(trackKey("", t.title))) map.set(trackKey("", t.title), i);
    });
    return map;
  }, [tracks]);

  const indexOf = useCallback(
    (position: string | undefined, title: string) =>
      indexByKey.get(trackKey(position, title)) ?? indexByKey.get(trackKey("", title)) ?? -1,
    [indexByKey]
  );

  const currentTrack: PlaylistTrack | null = currentIndex >= 0 ? tracks[currentIndex] : null;
  const currentLabel = currentTrack
    ? `${currentTrack.position ? `${currentTrack.position}. ` : ""}${currentTrack.title}`
    : current?.kind === "video"
      ? current.title
      : "";
  const available = tracks.filter((_, i) => isPlayable(i)).length;

  return {
    containerRef,
    mode,
    isPlaying,
    play,
    pause,
    toggle,
    isLoading,
    playlist,
    tracks,
    extraVideos,
    current,
    currentIndex,
    currentTrack,
    currentLabel,
    available,
    hasAnything: available > 0 || Boolean(playlist?.fullAlbum) || extraVideos.length > 0,
    isPlayable,
    indexOf,
    prevIndex: findPlayable(currentIndex - 1, -1),
    nextIndex: findPlayable(currentIndex + 1, 1),
    goTo,
    toggleTrack,
    playVideo,
  };
}

export type AlbumPlayer = ReturnType<typeof useAlbumPlayer>;

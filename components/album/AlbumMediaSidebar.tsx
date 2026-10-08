import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  SquarePlay,
  Radio,
  ExternalLink,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Film,
  Disc3,
} from "lucide-react";
import useTrackPlayer from "@/hooks/useTrackPlayer";
import type { AlbumPlaylist } from "@/services/youtube/getAlbumPlaylist";

interface SimilarTrackItem {
  name: string;
  match: number;
  url: string;
  mbid?: string;
  artist: {
    name: string;
  };
}

interface VideoItem {
  uri: string;
  title?: string;
}

interface AlbumMediaSidebarProps {
  discoId: number;
  title?: string;
  spotifyAlbumId?: string | null;
  isPopularAlbum?: boolean;
  artist: string;
  similarTracks?: SimilarTrackItem[];
  videos?: VideoItem[];
}

const jsonFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

const SOURCE_LABEL = {
  discogs: "Discogs",
  youtube: "YouTube",
  deezer: "Deezer 30 s",
} as const;

function youtubeIdFromUrl(url: string): string | null {
  const match =
    url?.match(/[?&]v=([A-Za-z0-9_-]{11})/) || url?.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export const AlbumMediaSidebar: React.FC<AlbumMediaSidebarProps> = ({
  discoId,
  title = "",
  spotifyAlbumId,
  isPopularAlbum,
  artist,
  similarTracks = [],
  videos = [],
}) => {
  const [activeTab, setActiveTab] = useState<"youtube" | "spotify">("youtube");
  const [isTracksOpen, setIsTracksOpen] = useState(false);

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

  type Selection = { kind: "track"; index: number } | { kind: "video"; videoId: string; title: string };
  const [selected, setCurrent] = useState<Selection | null>(null);
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

  const { containerRef, load, pause, toggle, isPlaying, mode } = useTrackPlayer({
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
    setCurrent({ kind: "track", index });
    load(tracks[index], autoplay);
  }

  function playVideo(videoId: string, videoTitle: string) {
    setCurrent({ kind: "video", videoId, title: videoTitle });
    load({ videoId });
  }

  // Al llegar la lista, dejar preparada la primera pista disponible (sin reproducir)
  useEffect(() => {
    if (!playlist || !initial) return;
    load(initial.kind === "track" ? playlist.tracks[initial.index] : { videoId: initial.videoId }, false);
  }, [playlist, initial, load]);

  const available = tracks.filter((_, i) => isPlayable(i)).length;
  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null;
  const currentLabel = currentTrack
    ? `${currentTrack.position ? `${currentTrack.position}. ` : ""}${currentTrack.title}`
    : current?.kind === "video"
      ? current.title
      : "";
  const hasAnything = available > 0 || Boolean(playlist?.fullAlbum) || extraVideos.length > 0;
  const youtubeExternalUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${artist} ${title}`
  )}`;

  return (
    <div className="tw-space-y-4">
      {/* Reproductor del disco (con pestaña opcional Spotify) */}
      <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-4 tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm">
        {/* Cabecera y Selector de Plataforma */}
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <SquarePlay className="tw-w-5 tw-h-5 tw-text-red-600" />
            <h3 className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
              Escuchar el disco
            </h3>
          </div>

          {/* Si Spotify está disponible, permitir alternar entre YouTube y Spotify */}
          {spotifyAlbumId && (
            <div className="tw-flex tw-items-center tw-gap-1 tw-bg-gray-100 dark:tw-bg-gray-750 tw-p-1 tw-rounded-xl tw-text-xs tw-font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("youtube")}
                className={`tw-px-2.5 tw-py-1 tw-rounded-lg tw-transition-colors ${
                  activeTab === "youtube"
                    ? "tw-bg-white dark:tw-bg-gray-700 tw-text-red-600 tw-shadow-xs"
                    : "tw-text-gray-500 hover:tw-text-gray-900"
                }`}
              >
                YouTube
              </button>
              <button
                type="button"
                onClick={() => {
                  pause();
                  setActiveTab("spotify");
                }}
                className={`tw-px-2.5 tw-py-1 tw-rounded-lg tw-transition-colors ${
                  activeTab === "spotify"
                    ? "tw-bg-white dark:tw-bg-gray-700 tw-text-green-600 tw-shadow-xs"
                    : "tw-text-gray-500 hover:tw-text-gray-900"
                }`}
              >
                Spotify
              </button>
            </div>
          )}
        </div>

        {/* Pestaña YouTube: siempre montada para no perder el reproductor */}
        <div className={activeTab === "youtube" ? "" : "tw-hidden"}>
          <div className="tw-relative tw-rounded-xl tw-overflow-hidden tw-shadow-inner tw-bg-black tw-aspect-video">
            <div ref={containerRef} className="tw-absolute tw-inset-0" />

            {/* Capa encima del vídeo: preview de Deezer, carga o sin resultados */}
            {mode !== "video" && (
              <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-center tw-px-4 tw-bg-gradient-to-br tw-from-gray-900 tw-to-black tw-text-gray-300 tw-text-sm">
                {isLoading ? (
                  <span>Buscando las pistas del disco…</span>
                ) : mode === "audio" ? (
                  <>
                    <Disc3
                      className={`tw-w-14 tw-h-14 tw-text-purple-400 ${isPlaying ? "tw-animate-spin" : ""}`}
                      style={{ animationDuration: "3s" }}
                    />
                    <span className="tw-font-semibold tw-text-white">{currentLabel}</span>
                    <span className="tw-text-xs tw-text-gray-400">Preview de 30 s · Deezer</span>
                  </>
                ) : hasAnything ? (
                  <span>Elige una pista para empezar.</span>
                ) : (
                  <span>No se ha encontrado este disco en Discogs, YouTube ni Deezer.</span>
                )}
              </div>
            )}
          </div>

          {/* Controles */}
          {hasAnything && (
            <div className="tw-flex tw-items-center tw-gap-3 tw-mt-3">
              <button
                type="button"
                onClick={() => goTo(findPlayable(currentIndex - 1, -1))}
                disabled={findPlayable(currentIndex - 1, -1) < 0}
                className="tw-p-2 tw-rounded-full tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-700 dark:tw-text-gray-200 hover:tw-bg-gray-200 disabled:tw-opacity-40 tw-transition-colors"
                title="Pista anterior"
              >
                <SkipBack className="tw-w-4 tw-h-4" />
              </button>
              <button
                type="button"
                onClick={toggle}
                disabled={!mode}
                className="tw-p-2.5 tw-rounded-full tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-shadow disabled:tw-opacity-40 tw-transition-colors"
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause className="tw-w-5 tw-h-5" /> : <Play className="tw-w-5 tw-h-5" />}
              </button>
              <button
                type="button"
                onClick={() => goTo(findPlayable(currentIndex + 1, 1))}
                disabled={findPlayable(currentIndex + 1, 1) < 0}
                className="tw-p-2 tw-rounded-full tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-700 dark:tw-text-gray-200 hover:tw-bg-gray-200 disabled:tw-opacity-40 tw-transition-colors"
                title="Siguiente pista"
              >
                <SkipForward className="tw-w-4 tw-h-4" />
              </button>
              <div className="tw-min-w-0 tw-flex-1">
                <p className="tw-text-xs tw-font-semibold tw-text-gray-800 dark:tw-text-gray-200 tw-truncate">
                  {currentLabel}
                </p>
                {tracks.length > 0 && (
                  <p className="tw-text-[11px] tw-text-gray-500">
                    {available} de {tracks.length} pistas disponibles
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tracklist del disco */}
          {tracks.length > 0 && (
            <ol className="tw-mt-3 tw-space-y-0.5 tw-max-h-64 tw-overflow-y-auto tw-pr-1">
              {tracks.map((track, idx) => {
                const playable = isPlayable(idx);
                const isCurrent = idx === currentIndex;
                return (
                  <li key={`${track.position}-${idx}`}>
                    <button
                      type="button"
                      disabled={!playable}
                      onClick={() => goTo(idx)}
                      className={`tw-w-full tw-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-rounded-lg tw-text-left tw-text-xs tw-transition-colors ${
                        isCurrent
                          ? "tw-bg-red-50 dark:tw-bg-red-950/40 tw-text-red-700 dark:tw-text-red-300 tw-font-semibold"
                          : playable
                            ? "tw-text-gray-700 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-750"
                            : "tw-text-gray-400 dark:tw-text-gray-600 tw-cursor-not-allowed"
                      }`}
                      title={playable ? `Reproducir ${track.title}` : "Sin audio disponible"}
                    >
                      <span className="tw-w-7 tw-shrink-0 tw-text-gray-400">
                        {isCurrent && isPlaying ? "▶" : track.position}
                      </span>
                      <span className="tw-flex-1 tw-truncate">{track.title}</span>
                      {playable && track.source && (
                        <span
                          className={`tw-shrink-0 tw-text-[10px] tw-px-1.5 tw-py-0.5 tw-rounded ${
                            track.source === "deezer"
                              ? "tw-bg-purple-100 dark:tw-bg-purple-950/50 tw-text-purple-700 dark:tw-text-purple-300"
                              : "tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-500 dark:tw-text-gray-400"
                          }`}
                        >
                          {SOURCE_LABEL[track.source]}
                        </span>
                      )}
                      {track.duration && (
                        <span className="tw-shrink-0 tw-text-gray-400">{track.duration}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Disco entero en un solo vídeo y otros vídeos de Discogs */}
          {(playlist?.fullAlbum || extraVideos.length > 0) && (
            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-1.5">
              {playlist?.fullAlbum && (
                <button
                  type="button"
                  onClick={() => playVideo(playlist.fullAlbum!.videoId, playlist.fullAlbum!.title)}
                  className="tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-px-2.5 tw-py-1 tw-rounded-lg tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-font-semibold"
                  title={playlist.fullAlbum.title}
                >
                  <Disc3 className="tw-w-3.5 tw-h-3.5" />
                  Disco completo (un vídeo)
                </button>
              )}
              {extraVideos.map((video) => (
                <button
                  key={video.videoId}
                  type="button"
                  onClick={() => playVideo(video.videoId, video.title)}
                  className={`tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-px-2.5 tw-py-1 tw-rounded-lg tw-truncate tw-max-w-[200px] tw-transition-colors ${
                    current?.kind === "video" && current.videoId === video.videoId
                      ? "tw-bg-red-600 tw-text-white tw-font-semibold"
                      : "tw-bg-gray-100 dark:tw-bg-gray-750 tw-text-gray-700 dark:tw-text-gray-300 hover:tw-bg-gray-200"
                  }`}
                  title={video.title}
                >
                  <Film className="tw-w-3 tw-h-3 tw-shrink-0" />
                  <span className="tw-truncate">{video.title || "Vídeo"}</span>
                </button>
              ))}
            </div>
          )}

          <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-gray-500">
            <span>{hasAnything ? "¿Falta algo?" : "Búscalo directamente en YouTube"}</span>
            <a
              href={youtubeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-red-600 hover:tw-underline tw-flex tw-items-center tw-gap-1"
            >
              <span>Buscar en YouTube</span>
              <ExternalLink className="tw-w-3 tw-h-3" />
            </a>
          </div>
        </div>

        {/* Pestaña de Spotify (solo si el usuario la selecciona y existe ID) */}
        {activeTab === "spotify" && (
          <div>
            {isPopularAlbum && (
              <p className="tw-text-xs tw-text-gray-500 dark:tw-text-gray-400 tw-bg-gray-100 dark:tw-bg-gray-750 tw-p-2.5 tw-rounded-xl tw-mb-3">
                ℹ️ Mostrando el álbum más popular del artista en Spotify:
              </p>
            )}
            <iframe
              src={`https://open.spotify.com/embed/album/${spotifyAlbumId}`}
              width="100%"
              height="352"
              frameBorder="0"
              allow="encrypted-media"
              className="tw-rounded-xl tw-shadow-inner"
            />
          </div>
        )}
      </div>

      {/* Canciones Similares (Last.fm) */}
      <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-overflow-hidden tw-shadow-sm">
        <button
          type="button"
          onClick={() => setIsTracksOpen(!isTracksOpen)}
          className="tw-w-full tw-p-4 tw-flex tw-items-center tw-justify-between tw-text-left hover:tw-bg-gray-50 dark:hover:tw-bg-gray-750 tw-transition-colors"
        >
          <div className="tw-flex tw-items-center tw-gap-2.5">
            <Radio className="tw-w-5 tw-h-5 tw-text-purple-500" />
            <span className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
              Canciones Similares
            </span>
            <span className="tw-text-xs tw-bg-purple-50 dark:tw-bg-purple-950/40 tw-text-purple-700 dark:tw-text-purple-300 tw-px-2 tw-py-0.5 tw-rounded-md">
              Last.fm
            </span>
          </div>
          <ChevronDown
            className={`tw-w-5 tw-h-5 tw-text-gray-400 tw-transition-transform tw-duration-200 ${
              isTracksOpen ? "tw-rotate-180" : ""
            }`}
          />
        </button>

        {isTracksOpen && (
          <div className="tw-p-4 tw-pt-0 tw-border-t tw-border-gray-100 dark:tw-border-gray-700/60">
            {similarTracks.length > 0 ? (
              <div className="tw-space-y-2 tw-mt-3">
                {similarTracks.slice(0, 5).map((track, idx) => {
                  const matchPct = Math.round((track.match || 0) * 100);
                  return (
                    <div
                      key={idx}
                      className="tw-flex tw-items-center tw-justify-between tw-p-2.5 tw-rounded-xl tw-bg-gray-50 dark:tw-bg-gray-750 hover:tw-bg-purple-50/50 dark:hover:tw-bg-purple-950/30 tw-transition-colors"
                    >
                      <div className="tw-min-w-0 tw-pr-2">
                        <a
                          href={track.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tw-text-sm tw-font-semibold tw-text-gray-800 dark:tw-text-gray-200 hover:tw-text-purple-600 dark:hover:tw-text-purple-400 tw-truncate tw-block"
                        >
                          {track.name}
                        </a>
                        <p className="tw-text-xs tw-text-gray-500 tw-truncate">
                          {track.artist.name}
                        </p>
                      </div>
                      <span className="tw-text-xs tw-font-medium tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-purple-100 dark:tw-bg-purple-900/40 tw-text-purple-800 dark:tw-text-purple-300 tw-shrink-0">
                        {matchPct}% match
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-3">
                No se encontraron tracks parecidos en Last.fm para {artist}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumMediaSidebar;

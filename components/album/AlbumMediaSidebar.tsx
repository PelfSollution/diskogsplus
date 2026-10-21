import React, { useState } from "react";
import {
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
import type { AlbumPlayer } from "@/hooks/useAlbumPlayer";

interface SimilarTrackItem {
  name: string;
  match: number;
  url: string;
  mbid?: string;
  artist: {
    name: string;
  };
}

interface AlbumMediaSidebarProps {
  player: AlbumPlayer;
  title?: string;
  spotifyAlbumId?: string | null;
  isPopularAlbum?: boolean;
  artist: string;
  similarTracks?: SimilarTrackItem[];
}

const SOURCE_LABEL = {
  discogs: "vídeo de Discogs",
  youtube: "YouTube",
  deezer: "preview de 30 s · Deezer",
} as const;

export const AlbumMediaSidebar: React.FC<AlbumMediaSidebarProps> = ({
  player,
  title = "",
  spotifyAlbumId,
  isPopularAlbum,
  artist,
  similarTracks = [],
}) => {
  const [activeTab, setActiveTab] = useState<"youtube" | "spotify">("youtube");
  const [isTracksOpen, setIsTracksOpen] = useState(false);

  const {
    containerRef,
    current,
    currentLabel,
    currentTrack,
    extraVideos,
    goTo,
    hasAnything,
    isLoading,
    isPlaying,
    mode,
    nextIndex,
    pause,
    playVideo,
    playlist,
    prevIndex,
    toggle,
  } = player;
  const youtubeExternalUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${artist} ${title}`
  )}`;

  return (
    <div className="tw-space-y-4">
      {/* Reproductor del disco (con pestaña opcional Spotify) */}
      <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-4 tw-border tw-border-gray-200 dark:tw-border-gray-700">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <Disc3 className="tw-w-5 tw-h-5 tw-text-brand-600" />
            <h3 className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
              Escuchar el disco
            </h3>
          </div>

          {/* Si Spotify está disponible, permitir alternar */}
          {spotifyAlbumId && (
            <div className="tw-flex tw-items-center tw-gap-1 tw-bg-gray-100 dark:tw-bg-gray-750 tw-p-1 tw-rounded-xl tw-text-xs tw-font-semibold">
              {(["youtube", "spotify"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    if (tab === "spotify") pause();
                    setActiveTab(tab);
                  }}
                  className={`tw-px-2.5 tw-py-1 tw-rounded-lg tw-transition-colors ${
                    activeTab === tab
                      ? "tw-bg-white dark:tw-bg-gray-700 tw-text-brand-700 dark:tw-text-brand-300 tw-shadow-xs"
                      : "tw-text-gray-500 hover:tw-text-gray-900 dark:hover:tw-text-white"
                  }`}
                >
                  {tab === "youtube" ? "Pistas" : "Spotify"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pestaña principal: siempre montada para no perder el reproductor */}
        <div className={activeTab === "youtube" ? "" : "tw-hidden"}>
          <div className="tw-relative tw-rounded-xl tw-overflow-hidden tw-bg-black tw-aspect-video">
            <div ref={containerRef} className="tw-absolute tw-inset-0" />

            {/* Capa encima del vídeo: preview de Deezer, carga o sin resultados */}
            {mode !== "video" && (
              <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-center tw-px-4 tw-bg-gradient-to-br tw-from-gray-900 tw-to-black tw-text-gray-300 tw-text-sm">
                {isLoading ? (
                  <span>Buscando las pistas del disco…</span>
                ) : mode === "audio" ? (
                  <>
                    <Disc3
                      className={`tw-w-14 tw-h-14 tw-text-brand-400 ${isPlaying ? "tw-animate-spin" : ""}`}
                      style={{ animationDuration: "3s" }}
                    />
                    <span className="tw-font-semibold tw-text-white">{currentLabel}</span>
                    <span className="tw-text-xs tw-text-gray-400">Preview de 30 s · Deezer</span>
                  </>
                ) : hasAnything ? (
                  <span>Elige una pista del tracklist para empezar.</span>
                ) : (
                  <span>No se ha encontrado este disco en Discogs, YouTube ni Deezer.</span>
                )}
              </div>
            )}
          </div>

          {/* Controles y pista actual */}
          {hasAnything && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-mt-3">
              <button
                type="button"
                onClick={() => goTo(prevIndex)}
                disabled={prevIndex < 0}
                className="tw-p-2 tw-rounded-full tw-text-gray-600 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700 disabled:tw-opacity-30 tw-transition-colors"
                title="Pista anterior"
              >
                <SkipBack className="tw-w-4 tw-h-4" />
              </button>
              <button
                type="button"
                onClick={toggle}
                disabled={!mode}
                className="tw-p-2.5 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white disabled:tw-opacity-40 tw-transition-colors"
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause className="tw-w-5 tw-h-5" /> : <Play className="tw-w-5 tw-h-5" />}
              </button>
              <button
                type="button"
                onClick={() => goTo(nextIndex)}
                disabled={nextIndex < 0}
                className="tw-p-2 tw-rounded-full tw-text-gray-600 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700 disabled:tw-opacity-30 tw-transition-colors"
                title="Siguiente pista"
              >
                <SkipForward className="tw-w-4 tw-h-4" />
              </button>
              <div className="tw-min-w-0 tw-flex-1 tw-pl-1">
                <p className="tw-text-sm tw-font-semibold tw-text-gray-900 dark:tw-text-white tw-truncate">
                  {currentLabel || "—"}
                </p>
                <p className="tw-text-xs tw-text-gray-500 dark:tw-text-gray-400 tw-truncate">
                  {currentTrack?.source
                    ? SOURCE_LABEL[currentTrack.source]
                    : current?.kind === "video"
                      ? "Vídeo"
                      : ""}
                </p>
              </div>
            </div>
          )}

          {/* Disco entero en un solo vídeo y otros vídeos de Discogs */}
          {(playlist?.fullAlbum || extraVideos.length > 0) && (
            <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-100 dark:tw-border-gray-700/60">
              <p className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-400 tw-mb-2">
                Más vídeos
              </p>
              <div className="tw-flex tw-flex-wrap tw-gap-1.5">
                {playlist?.fullAlbum && (
                  <button
                    type="button"
                    onClick={() => playVideo(playlist.fullAlbum!.videoId, playlist.fullAlbum!.title)}
                    className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-px-2.5 tw-py-1 tw-rounded-lg tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-font-semibold"
                    title={playlist.fullAlbum.title}
                  >
                    <Disc3 className="tw-w-3.5 tw-h-3.5" />
                    Disco completo
                  </button>
                )}
                {extraVideos.map((video) => {
                  const active = current?.kind === "video" && current.videoId === video.videoId;
                  return (
                    <button
                      key={video.videoId}
                      type="button"
                      onClick={() => playVideo(video.videoId, video.title)}
                      className={`tw-flex tw-items-center tw-gap-1 tw-text-xs tw-px-2.5 tw-py-1 tw-rounded-lg tw-max-w-[220px] tw-transition-colors ${
                        active
                          ? "tw-bg-brand-600 tw-text-white tw-font-semibold"
                          : "tw-bg-gray-100 dark:tw-bg-gray-750 tw-text-gray-700 dark:tw-text-gray-300 hover:tw-bg-gray-200 dark:hover:tw-bg-gray-700"
                      }`}
                      title={video.title}
                    >
                      <Film className="tw-w-3 tw-h-3 tw-shrink-0" />
                      <span className="tw-truncate">{video.title || "Vídeo"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-gray-500">
            <span>{hasAnything ? "¿Falta algo?" : "Búscalo directamente"}</span>
            <a
              href={youtubeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-brand-600 dark:tw-text-brand-400 hover:tw-underline tw-flex tw-items-center tw-gap-1"
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
      <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-overflow-hidden">
        <button
          type="button"
          onClick={() => setIsTracksOpen(!isTracksOpen)}
          className="tw-w-full tw-p-4 tw-flex tw-items-center tw-justify-between tw-text-left hover:tw-bg-gray-50 dark:hover:tw-bg-gray-750 tw-transition-colors"
        >
          <div className="tw-flex tw-items-center tw-gap-2.5">
            <Radio className="tw-w-5 tw-h-5 tw-text-brand-500" />
            <span className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
              Canciones similares
            </span>
            <span className="tw-text-xs tw-bg-brand-50 dark:tw-bg-brand-950/40 tw-text-brand-700 dark:tw-text-brand-300 tw-px-2 tw-py-0.5 tw-rounded-md">
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
                      className="tw-flex tw-items-center tw-justify-between tw-p-2.5 tw-rounded-xl tw-bg-gray-50 dark:tw-bg-gray-750 hover:tw-bg-brand-50/50 dark:hover:tw-bg-brand-950/30 tw-transition-colors"
                    >
                      <div className="tw-min-w-0 tw-pr-2">
                        <a
                          href={track.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tw-text-sm tw-font-semibold tw-text-gray-800 dark:tw-text-gray-200 hover:tw-text-brand-600 dark:hover:tw-text-brand-400 tw-truncate tw-block"
                        >
                          {track.name}
                        </a>
                        <p className="tw-text-xs tw-text-gray-500 tw-truncate">
                          {track.artist.name}
                        </p>
                      </div>
                      <span className="tw-text-xs tw-font-medium tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-brand-100 dark:tw-bg-brand-900/40 tw-text-brand-800 dark:tw-text-brand-300 tw-shrink-0">
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

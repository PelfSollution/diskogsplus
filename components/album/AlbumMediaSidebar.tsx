import React, { useState } from "react";
import {
  SquarePlay,
  Music,
  Radio,
  ExternalLink,
  ChevronDown,
  Play,
  Film,
} from "lucide-react";

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
  title?: string;
  spotifyAlbumId?: string | null;
  isPopularAlbum?: boolean;
  artist: string;
  similarTracks?: SimilarTrackItem[];
  videos?: VideoItem[];
}

export const AlbumMediaSidebar: React.FC<AlbumMediaSidebarProps> = ({
  title = "",
  spotifyAlbumId,
  isPopularAlbum,
  artist,
  similarTracks = [],
  videos = [],
}) => {
  const [activeTab, setActiveTab] = useState<"youtube" | "spotify">("youtube");
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isTracksOpen, setIsTracksOpen] = useState(false);

  function transformYouTubeUrlToEmbed(url: string): string {
    if (!url) return "";
    if (url.includes("embed/")) return url;
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    const videoCode = match ? match[1] : url.split("v=")[1];
    return videoCode
      ? `https://www.youtube-nocookie.com/embed/${videoCode}`
      : url;
  }

  const currentVideo = videos[activeVideoIndex];
  const youtubeSearchEmbedUrl = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
    `${artist} ${title}`
  )}`;

  const youtubeExternalUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${artist} ${title}`
  )}`;

  return (
    <div className="tw-space-y-4">
      {/* Reproductor Principal: YouTube Audio & Vídeo (con pestaña opcional Spotify) */}
      <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-4 tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm">
        {/* Cabecera y Selector de Plataforma */}
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <SquarePlay className="tw-w-5 tw-h-5 tw-text-red-600" />
            <h3 className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
              Reproducir Audio & Vídeo
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
                onClick={() => setActiveTab("spotify")}
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

        {/* Contenido según pestaña activa */}
        {activeTab === "youtube" ? (
          <div>
            {/* Reproductor Embebido de YouTube */}
            <div className="tw-rounded-xl tw-overflow-hidden tw-shadow-inner tw-bg-black tw-aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={
                  videos.length > 0
                    ? transformYouTubeUrlToEmbed(currentVideo.uri)
                    : youtubeSearchEmbedUrl
                }
                title={`Reproductor YouTube: ${artist} - ${title}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="tw-w-full tw-h-full"
              />
            </div>

            {/* Selector de pistas de vídeo si hay varios clips en Discogs */}
            {videos.length > 0 && (
              <div className="tw-mt-3">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                  <span className="tw-text-xs tw-font-semibold tw-text-gray-600 dark:tw-text-gray-400 tw-truncate">
                    {currentVideo?.title || `Vídeo ${activeVideoIndex + 1} de ${videos.length}`}
                  </span>
                  <a
                    href={currentVideo?.uri || youtubeExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-text-xs tw-text-red-600 hover:tw-underline tw-flex tw-items-center tw-gap-1 tw-shrink-0"
                  >
                    <span>Abrir en YouTube</span>
                    <ExternalLink className="tw-w-3 tw-h-3" />
                  </a>
                </div>

                {videos.length > 1 && (
                  <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-max-h-24 tw-overflow-y-auto">
                    {videos.map((vid, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveVideoIndex(idx)}
                        className={`tw-text-[11px] tw-px-2.5 tw-py-1 tw-rounded-lg tw-truncate tw-max-w-[200px] tw-transition-colors ${
                          activeVideoIndex === idx
                            ? "tw-bg-red-600 tw-text-white tw-font-semibold"
                            : "tw-bg-gray-100 dark:tw-bg-gray-750 tw-text-gray-700 dark:tw-text-gray-300 hover:tw-bg-gray-200"
                        }`}
                        title={vid.title || `Vídeo ${idx + 1}`}
                      >
                        {vid.title || `Pista ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Enlace alternativo si Discogs no tiene vídeos enlazados directamente */}
            {videos.length === 0 && (
              <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-gray-500">
                <span>Búsqueda automática en YouTube Music</span>
                <a
                  href={youtubeExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-text-red-600 hover:tw-underline tw-flex tw-items-center tw-gap-1"
                >
                  <span>Ver en YouTube</span>
                  <ExternalLink className="tw-w-3 tw-h-3" />
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Pestaña de Spotify (solo activa si el usuario la selecciona y existe ID) */
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

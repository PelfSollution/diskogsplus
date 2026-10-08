import React, { memo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Play, Trash2, SquarePlay, ExternalLink } from "lucide-react";
import { getCamelotColor, getPitchClassNotation } from "@/lib/musicNotation";

export type MixtapeTrack = {
  id?: number | string;
  username: string;
  artista: string;
  trackname: string;
  disco_id: string;
  spotifytrackid?: string | null;
  tempo?: number | null;
  key?: number | null;
  mode?: number | null;
  duration?: string | null;
};

type MixtapeRowProps = {
  data: MixtapeTrack;
  onDelete: (track: MixtapeTrack) => void;
  onPlay?: (track: MixtapeTrack) => void;
  isPlaying?: boolean;
};

const jsonFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

const MixtapeRowComponent: React.FC<MixtapeRowProps> = ({
  data,
  onDelete,
  onPlay,
  isPlaying = false,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${data.artista} ${data.trackname}`
  )}`;

  // Vídeo de la pista a partir de los vídeos de Discogs; solo se pide al abrir la preescucha
  const { data: videoData, isLoading: isVideoLoading } = useSWR(
    showPreview && data.disco_id
      ? `/api/mixtape/video?disco_id=${encodeURIComponent(data.disco_id)}&track=${encodeURIComponent(data.trackname)}`
      : null,
    jsonFetcher,
    { revalidateOnFocus: false }
  );
  const videoId: string | undefined = videoData?.video?.videoId;
  const youtubeEmbedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`
    : "";

  const keyInfo =
    typeof data.key === "number" && typeof data.mode === "number"
      ? getPitchClassNotation(data.key, data.mode)
      : null;

  return (
    <div
      className={`tw-border tw-rounded-2xl tw-p-4 tw-transition-all tw-duration-200 tw-shadow-sm hover:tw-shadow-md ${
        isPlaying
          ? "tw-bg-brand-50/60 dark:tw-bg-brand-950/30 tw-border-brand-300 dark:tw-border-brand-700 ring-2 ring-purple-400"
          : "tw-bg-white dark:tw-bg-gray-800 tw-border-gray-200 dark:tw-border-gray-700"
      }`}
    >
      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-items-start lg:tw-items-center tw-justify-between">
        {/* Columna Izquierda: Información del tema y artista */}
        <div className="tw-flex-1 tw-min-w-0">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
            <span className="tw-font-bold tw-text-base tw-text-gray-900 dark:tw-text-white tw-truncate">
              {data.artista}
            </span>
          </div>

          <Link
            href={`/albums/${data.disco_id}`}
            className="tw-text-sm tw-font-medium tw-text-brand-600 dark:tw-text-brand-400 hover:tw-underline tw-block tw-truncate"
            title="Ver vinilo en el catálogo"
          >
            {data.trackname}
          </Link>

          {/* Badges de BPM, Camelot Wheel y Duración */}
          <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2.5 tw-items-center">
            {data.tempo && (
              <span className="tw-text-xs tw-font-semibold tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-700 dark:tw-text-gray-300 tw-px-2.5 tw-py-1 tw-rounded-lg">
                ⚡ {Math.round(data.tempo)} BPM
              </span>
            )}

            {keyInfo && (
              <span
                className={`tw-text-xs tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-lg tw-text-white ${getCamelotColor(
                  keyInfo.camelotCode
                )}`}
              >
                {keyInfo.full}
              </span>
            )}

            {data.duration && (
              <span className="tw-text-xs tw-text-gray-500 dark:tw-text-gray-400">
                ⏱ {data.duration}
              </span>
            )}
          </div>
        </div>

        {/* Columna Centro: Reproductor de YouTube / Preescucha rápida */}
        <div className="tw-w-full lg:tw-w-auto tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          {showPreview ? (
            <div className="tw-w-full sm:tw-w-[320px] tw-h-[85px] tw-rounded-xl tw-overflow-hidden tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-inner tw-bg-black">
              {youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  width="100%"
                  height="100%"
                  title={`Reproductor YouTube: ${data.trackname}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="tw-w-full tw-h-full"
                />
              ) : (
                <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-text-xs tw-text-gray-400">
                  {isVideoLoading ? (
                    "Buscando vídeo…"
                  ) : (
                    <>
                      Sin vídeo en Discogs ·
                      <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" className="tw-text-brand-400 hover:tw-underline">
                        Buscar en YouTube
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onPlay) {
                  onPlay(data);
                } else {
                  setShowPreview(true);
                }
              }}
              className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-px-3.5 tw-py-2 tw-rounded-xl tw-bg-brand-50 dark:tw-bg-brand-950/40 tw-text-brand-700 dark:tw-text-brand-300 hover:tw-bg-brand-100 dark:hover:tw-bg-brand-900/50 tw-border tw-border-brand-200 dark:tw-border-brand-800 tw-transition-colors"
            >
              <SquarePlay className="tw-w-4 tw-h-4" />
              <span>{isPlaying ? "Reproduciendo" : "Escuchar audio"}</span>
            </button>
          )}

          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-gray-400 hover:tw-text-gray-600 dark:hover:tw-text-gray-200 tw-p-2 tw-rounded-lg hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700 tw-transition-colors"
            title="Abrir en YouTube"
          >
            <ExternalLink className="tw-w-4 tw-h-4" />
          </a>
        </div>

        {/* Columna Derecha: Botón Eliminar */}
        <div className="tw-w-full lg:tw-w-auto tw-flex tw-justify-end">
          <button
            type="button"
            onClick={() => onDelete(data)}
            className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-px-3 tw-py-2 tw-rounded-xl tw-text-red-500 hover:tw-text-red-700 hover:tw-bg-red-50 dark:hover:tw-bg-red-950/40 tw-border tw-border-transparent hover:tw-border-red-200 tw-transition-colors"
            title="Eliminar de la Mixtape"
          >
            <Trash2 className="tw-w-4 tw-h-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

MixtapeRowComponent.displayName = "MixtapeRow";
export default memo(MixtapeRowComponent);

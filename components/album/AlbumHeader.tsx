import React from "react";
import Link from "next/link";
import { Bot, Heart, Pause, Play } from "lucide-react";

interface AlbumHeaderProps {
  artist: string;
  title: string;
  year?: string | number;
  format?: string;
  label?: string;
  genres?: string[];
  lastfmTags?: string[];
  discoId: number | string;
  onAskChat: () => void;
  fromCompare?: boolean;
  inWantlist: boolean;
  onToggleWantlist: () => void;
  wantlistLoading: boolean;
  /** Reproducir o pausar el disco (sin audio, no hay botón) */
  onPlay?: () => void;
  isPlaying?: boolean;
}

export const AlbumHeader: React.FC<AlbumHeaderProps> = ({
  artist,
  title,
  year,
  format,
  label,
  genres = [],
  lastfmTags = [],
  onAskChat,
  fromCompare,
  inWantlist,
  onToggleWantlist,
  wantlistLoading,
  onPlay,
  isPlaying = false,
}) => {
  const outlineButton =
    "tw-flex tw-items-center tw-gap-2 tw-h-11 tw-px-4 tw-rounded-full tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-medium tw-text-gray-900 hover:tw-bg-gray-50 tw-transition-colors disabled:tw-opacity-60";

  return (
    <div className="tw-flex-1 tw-basis-80 tw-min-w-0 tw-flex tw-flex-col tw-gap-3">
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-brand-700">
        {[format, year].filter(Boolean).join(" · ")}
      </span>
      <h1 className="tw-text-3xl md:tw-text-[44px] md:tw-leading-[1.05] tw-font-bold tw-tracking-tight tw-text-gray-900">
        {title}
      </h1>
      <p className="tw-text-lg tw-font-medium tw-text-gray-700">{artist}</p>

      {(label || genres.length > 0 || lastfmTags.length > 0) && (
        <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-mt-1">
          {label && (
            <span className="tw-text-xs tw-font-medium tw-px-2.5 tw-py-1 tw-rounded-full tw-bg-white tw-border tw-border-gray-200 tw-text-gray-700">
              {label}
            </span>
          )}
          {genres.map((g) => (
            <span
              key={g}
              className="tw-text-xs tw-font-medium tw-px-2.5 tw-py-1 tw-rounded-full tw-bg-white tw-border tw-border-gray-200 tw-text-gray-700"
            >
              {g}
            </span>
          ))}
          {lastfmTags.slice(0, 4).map((t) => (
            <span key={t} className="tw-text-xs tw-px-2.5 tw-py-1 tw-rounded-full tw-bg-black/5 tw-text-gray-600">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="tw-flex tw-flex-wrap tw-gap-2.5 tw-mt-3">
        {onPlay && (
          <button
            type="button"
            onClick={onPlay}
            className="tw-flex tw-items-center tw-gap-2 tw-h-11 tw-px-5 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-sm tw-font-semibold tw-transition-colors"
          >
            {isPlaying ? <Pause className="tw-w-4 tw-h-4 tw-fill-current" /> : <Play className="tw-w-4 tw-h-4 tw-fill-current" />}
            {isPlaying ? "Pausar" : "Escuchar el disco"}
          </button>
        )}
        <button type="button" onClick={onAskChat} className={outlineButton}>
          <Bot className="tw-w-4 tw-h-4" />
          Preguntar a DiscBOT
        </button>
        {fromCompare && (
          <button
            type="button"
            disabled={wantlistLoading}
            onClick={onToggleWantlist}
            aria-pressed={inWantlist}
            className={outlineButton}
          >
            <Heart className={`tw-w-4 tw-h-4 ${inWantlist ? "tw-fill-brand-600 tw-text-brand-600" : ""}`} />
            {wantlistLoading ? "Guardando…" : inWantlist ? "En tu wantlist" : "Añadir a la wantlist"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AlbumHeader;

import React from "react";
import Link from "next/link";
import { MessageSquare, Heart, Trash2 } from "lucide-react";

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
}) => {
  return (
    <div className="tw-flex-1 tw-flex tw-flex-col tw-justify-between">
      <div>
        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
          {format && (
            <span className="tw-text-xs tw-font-semibold tw-text-brand-600 dark:tw-text-brand-400 tw-uppercase tw-tracking-wider">
              {format}
            </span>
          )}
          {year && (
            <span className="tw-bg-gray-100 dark:tw-bg-gray-800 tw-text-gray-700 dark:tw-text-gray-300 tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium">
              {year}
            </span>
          )}
        </div>

        <h1 className="tw-text-2xl md:tw-text-3xl tw-font-extrabold tw-text-gray-900 dark:tw-text-white tw-tracking-tight tw-leading-tight">
          {title}
        </h1>
        <h2 className="tw-text-lg md:tw-text-xl tw-font-semibold tw-text-gray-600 dark:tw-text-gray-300 tw-mb-3">
          {artist}
        </h2>

        {label && (
          <div className="tw-text-xs tw-text-gray-500 dark:tw-text-gray-400 tw-mb-3">
            Sello: <span className="tw-font-medium tw-text-gray-700 dark:tw-text-gray-300">{label}</span>
          </div>
        )}

        {/* Tags / Géneros */}
        {(genres.length > 0 || lastfmTags.length > 0) && (
          <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-mb-4">
            {genres.map((g) => (
              <span
                key={g}
                className="tw-text-xs tw-bg-brand-50 dark:tw-bg-brand-950/40 tw-text-brand-700 dark:tw-text-brand-300 tw-border tw-border-brand-200 dark:tw-border-brand-900 tw-px-2.5 tw-py-0.5 tw-rounded-full"
              >
                {g}
              </span>
            ))}
            {lastfmTags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="tw-text-xs tw-bg-gray-100 dark:tw-bg-gray-800 tw-text-gray-600 dark:tw-text-gray-300 tw-px-2.5 tw-py-0.5 tw-rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="tw-flex tw-flex-wrap tw-gap-2.5 tw-mt-2">
        <button
          type="button"
          onClick={onAskChat}
          className="tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-font-medium tw-text-sm tw-px-4 tw-py-2 tw-rounded-xl tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-all"
        >
          <MessageSquare className="tw-w-4 tw-h-4" />
          <span>Preguntar a DiscBOT Agent</span>
        </button>

        {fromCompare && (
          <button
            type="button"
            disabled={wantlistLoading}
            onClick={onToggleWantlist}
            className={`tw-font-medium tw-text-sm tw-px-4 tw-py-2 tw-rounded-xl tw-border tw-flex tw-items-center tw-gap-1.5 tw-transition-colors ${
              inWantlist
                ? "tw-border-brand-600 tw-bg-brand-600 tw-text-white hover:tw-bg-brand-700"
                : "tw-border-gray-300 dark:tw-border-gray-600 tw-text-gray-700 dark:tw-text-gray-200 hover:tw-bg-gray-50 dark:hover:tw-bg-gray-750"
            }`}
          >
            {inWantlist ? (
              <>
                <Trash2 className="tw-w-4 tw-h-4" />
                <span>{wantlistLoading ? "Quitando..." : "Quitar de Wantlist"}</span>
              </>
            ) : (
              <>
                <Heart className="tw-w-4 tw-h-4" />
                <span>{wantlistLoading ? "Guardando..." : "Añadir a Wantlist"}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AlbumHeader;

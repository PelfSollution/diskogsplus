import React from "react";
import Link from "next/link";
import { MessageSquare, Heart, Trash2 } from "lucide-react";

interface AlbumHeaderProps {
  artist: string;
  title: string;
  year?: string | number;
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
  label,
  genres = [],
  lastfmTags = [],
  discoId,
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
          <span className="tw-text-xs tw-font-semibold tw-text-purple-600 dark:tw-text-purple-400 tw-uppercase tw-tracking-wider">
            Vinilo #{discoId}
          </span>
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
                className="tw-text-xs tw-bg-blue-50 dark:tw-bg-blue-950/40 tw-text-blue-700 dark:tw-text-blue-300 tw-border tw-border-blue-200 dark:tw-border-blue-900 tw-px-2.5 tw-py-0.5 tw-rounded-full"
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
          className="tw-bg-gradient-to-r tw-from-purple-600 tw-to-blue-600 hover:tw-from-purple-700 hover:tw-to-blue-700 tw-text-white tw-font-medium tw-text-sm tw-px-4 tw-py-2 tw-rounded-xl tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-all"
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
                ? "tw-border-red-300 tw-text-red-600 dark:tw-text-red-400 tw-bg-red-50 dark:tw-bg-red-950/30 hover:tw-bg-red-100"
                : "tw-border-emerald-300 tw-text-emerald-700 dark:tw-text-emerald-400 tw-bg-emerald-50 dark:tw-bg-emerald-950/30 hover:tw-bg-emerald-100"
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

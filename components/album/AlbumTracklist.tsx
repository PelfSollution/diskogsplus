import React, { useState } from "react";
import { Check, ChevronDown, Disc, Pause, Play, Plus } from "lucide-react";
import { getKeyNotation } from "@/lib/musicNotation";
import type { AlbumPlayer } from "@/hooks/useAlbumPlayer";

export interface TrackItem {
  position?: string;
  title: string;
  duration?: string;
  spotifyTrackId?: string;
  tempo?: number;
  key?: number;
  mode?: number;
}

interface AlbumTracklistProps {
  tracklist: TrackItem[];
  player: AlbumPlayer;
  isSongInMixtape: (title: string) => boolean;
  onAddToMixtape: (track: TrackItem) => void;
  onDeleteFromMixtape: (track: TrackItem) => void;
  /** Selector de la mixtape a la que se añaden las pistas */
  mixtapeSelector?: React.ReactNode;
}

const SOURCE_LABEL = {
  discogs: "Discogs",
  youtube: "YouTube",
  deezer: "30 s",
} as const;

/** Tracklist del disco: reproducir, BPM/Camelot y añadir a la mixtape en cada pista */
export const AlbumTracklist: React.FC<AlbumTracklistProps> = ({
  tracklist = [],
  player,
  isSongInMixtape,
  onAddToMixtape,
  onDeleteFromMixtape,
  mixtapeSelector,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-overflow-hidden tw-shadow-sm tw-mt-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-p-4 tw-flex tw-items-center tw-justify-between tw-text-left hover:tw-bg-gray-50 dark:hover:tw-bg-gray-750 tw-transition-colors"
      >
        <div className="tw-flex tw-items-center tw-gap-2.5">
          <Disc className="tw-w-5 tw-h-5 tw-text-brand-600" />
          <span className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
            Tracklist
          </span>
          {player.tracks.length > 0 && (
            <span className="tw-text-xs tw-text-gray-500 dark:tw-text-gray-400">
              {player.available} de {player.tracks.length} con audio
            </span>
          )}
          {player.isLoading && (
            <span className="tw-text-xs tw-text-gray-400">Buscando audio…</span>
          )}
        </div>
        <ChevronDown
          className={`tw-w-5 tw-h-5 tw-text-gray-400 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && mixtapeSelector && (
        <div className="tw-px-4 tw-py-2 tw-border-t tw-border-gray-100 dark:tw-border-gray-700/60">
          {mixtapeSelector}
        </div>
      )}

      {isOpen && (
        <ol className="tw-px-2 tw-pb-2 tw-border-t tw-border-gray-100 dark:tw-border-gray-700/60">
          {tracklist.map((track, idx) => {
            const inMixtape = isSongInMixtape(track.title);
            const hasCamelot = typeof track.key === "number" && typeof track.mode === "number";
            const notation = hasCamelot ? getKeyNotation(track.key!, track.mode!) : null;

            const playIndex = player.indexOf(track.position, track.title);
            const playable = playIndex >= 0 && player.isPlayable(playIndex);
            const isCurrent = playIndex >= 0 && playIndex === player.currentIndex;
            const source = playable ? player.tracks[playIndex]?.source : null;

            return (
              <li
                key={idx}
                className={`tw-flex tw-items-center tw-gap-3 tw-px-2 tw-py-2 tw-rounded-xl tw-transition-colors ${
                  isCurrent ? "tw-bg-brand-50 dark:tw-bg-brand-950/40" : "hover:tw-bg-gray-50 dark:hover:tw-bg-gray-750"
                }`}
              >
                {/* Posición / play */}
                <button
                  type="button"
                  disabled={!playable}
                  onClick={() => player.toggleTrack(playIndex)}
                  className={`tw-group tw-relative tw-w-9 tw-h-9 tw-shrink-0 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-xs tw-font-bold tw-transition-colors ${
                    isCurrent
                      ? "tw-bg-brand-600 tw-text-white"
                      : playable
                        ? "tw-text-gray-500 dark:tw-text-gray-400 hover:tw-bg-brand-600 hover:tw-text-white"
                        : "tw-text-gray-300 dark:tw-text-gray-600 tw-cursor-not-allowed"
                  }`}
                  title={playable ? (isCurrent && player.isPlaying ? "Pausar" : `Reproducir ${track.title}`) : "Sin audio disponible"}
                >
                  {isCurrent ? (
                    player.isPlaying ? <Pause className="tw-w-4 tw-h-4" /> : <Play className="tw-w-4 tw-h-4" />
                  ) : (
                    <>
                      <span className={playable ? "group-hover:tw-hidden" : ""}>{track.position || idx + 1}</span>
                      {playable && <Play className="tw-w-4 tw-h-4 tw-hidden group-hover:tw-block" />}
                    </>
                  )}
                </button>

                {/* Título y datos */}
                <div className="tw-flex-1 tw-min-w-0">
                  <p
                    className={`tw-text-sm tw-font-semibold tw-truncate ${
                      isCurrent ? "tw-text-brand-700 dark:tw-text-brand-300" : "tw-text-gray-900 dark:tw-text-white"
                    }`}
                  >
                    {track.title}
                  </p>
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-mt-0.5 tw-text-xs tw-text-gray-500 dark:tw-text-gray-400">
                    {track.duration && <span>{track.duration}</span>}
                    {track.tempo ? (
                      <span className="tw-font-medium tw-text-gray-700 dark:tw-text-gray-300">
                        {Math.round(track.tempo)} BPM
                      </span>
                    ) : null}
                    {notation && (
                      <span className={`tw-font-bold tw-text-white tw-px-1.5 tw-py-px tw-rounded ${notation.color}`}>
                        {notation.notation}
                      </span>
                    )}
                    {source && (
                      <span className="tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-gray-400">
                        {SOURCE_LABEL[source]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mixtape */}
                <button
                  type="button"
                  onClick={() => (inMixtape ? onDeleteFromMixtape(track) : onAddToMixtape(track))}
                  className={`tw-w-8 tw-h-8 tw-shrink-0 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-colors ${
                    inMixtape
                      ? "tw-bg-vinyl-500 tw-text-white hover:tw-bg-vinyl-600"
                      : "tw-border tw-border-gray-300 dark:tw-border-gray-600 tw-text-gray-500 dark:tw-text-gray-400 hover:tw-border-vinyl-500 hover:tw-text-vinyl-600"
                  }`}
                  title={inMixtape ? "Quitar de la mixtape" : "Añadir a la mixtape"}
                  aria-label={inMixtape ? "Quitar de la mixtape" : "Añadir a la mixtape"}
                >
                  {inMixtape ? <Check className="tw-w-4 tw-h-4" /> : <Plus className="tw-w-4 tw-h-4" />}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default AlbumTracklist;

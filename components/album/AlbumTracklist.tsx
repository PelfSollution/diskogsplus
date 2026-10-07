import React, { useState } from "react";
import { ChevronDown, Disc, Plus, Trash2 } from "lucide-react";
import { getKeyNotation } from "@/lib/musicNotation";

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
  isSongInMixtape: (title: string) => boolean;
  onAddToMixtape: (track: TrackItem) => void;
  onDeleteFromMixtape: (track: TrackItem) => void;
}

export const AlbumTracklist: React.FC<AlbumTracklistProps> = ({
  tracklist = [],
  isSongInMixtape,
  onAddToMixtape,
  onDeleteFromMixtape,
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
          <Disc className="tw-w-5 tw-h-5 tw-text-emerald-500" />
          <span className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
            Tracklist & Armonía DJ
          </span>
          <span className="tw-text-xs tw-bg-emerald-50 dark:tw-bg-emerald-950/40 tw-text-emerald-700 dark:tw-text-emerald-300 tw-px-2 tw-py-0.5 tw-rounded-md">
            BPM & Camelot
          </span>
        </div>
        <ChevronDown
          className={`tw-w-5 tw-h-5 tw-text-gray-400 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="tw-p-4 tw-pt-0 tw-border-t tw-border-gray-100 dark:tw-border-gray-700/60 tw-divide-y tw-divide-gray-100 dark:tw-divide-gray-700/40">
          {tracklist.map((track, idx) => {
            const inMixtape = isSongInMixtape(track.title);
            const hasCamelot =
              typeof track.key === "number" &&
              track.key !== null &&
              typeof track.mode === "number" &&
              track.mode !== null;
            const notation = hasCamelot ? getKeyNotation(track.key!, track.mode!) : null;

            return (
              <div
                key={idx}
                className="tw-py-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3"
              >
                <div className="tw-flex-1 tw-min-w-[200px]">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    {track.position && (
                      <span className="tw-text-xs tw-font-bold tw-text-gray-400 tw-w-6">
                        {track.position}
                      </span>
                    )}
                    <span className="tw-text-sm tw-font-semibold tw-text-gray-900 dark:tw-text-white">
                      {track.title}
                    </span>
                    {track.duration && (
                      <span className="tw-text-xs tw-text-gray-400">
                        {track.duration}
                      </span>
                    )}
                  </div>

                  {/* Pills de audio (BPM y Camelot) */}
                  <div className="tw-flex tw-items-center tw-gap-1.5 tw-mt-1.5 tw-pl-8">
                    {track.tempo && (
                      <span className="tw-text-xs tw-font-medium tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-700 dark:tw-text-gray-300 tw-px-2 tw-py-0.5 tw-rounded-md">
                        {Math.round(track.tempo)} BPM
                      </span>
                    )}

                    {notation && (
                      <span
                        className={`tw-text-xs tw-font-bold tw-px-2 tw-py-0.5 tw-rounded-md ${notation.color}`}
                      >
                        {notation.notation}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón de Mixtape */}
                <div>
                  {inMixtape ? (
                    <button
                      type="button"
                      onClick={() => onDeleteFromMixtape(track)}
                      className="tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-red-200 dark:tw-border-red-800 tw-text-red-600 dark:tw-text-red-400 hover:tw-bg-red-50 dark:hover:tw-bg-red-950/30 tw-flex tw-items-center tw-gap-1 tw-transition-colors"
                    >
                      <Trash2 className="tw-w-3.5 tw-h-3.5" />
                      <span>Quitar de Mixtape</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddToMixtape(track)}
                      className="tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-emerald-300 dark:tw-border-emerald-700 tw-text-emerald-700 dark:tw-text-emerald-300 hover:tw-bg-emerald-50 dark:hover:tw-bg-emerald-950/30 tw-flex tw-items-center tw-gap-1 tw-transition-colors"
                    >
                      <Plus className="tw-w-3.5 tw-h-3.5" />
                      <span>Añadir a Mixtape</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlbumTracklist;

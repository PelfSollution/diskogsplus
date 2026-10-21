import React from "react";
import { Check, Pause, Play, Plus } from "lucide-react";
import CamelotChip from "@/components/CamelotChip";
import { durationToSeconds, formatSessionDuration, vinylSide } from "@/lib/vinyl";
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

/** Pistas agrupadas por cara del vinilo («A1» → cara A); sin caras, un solo grupo. */
function groupBySide(tracklist: TrackItem[]) {
  const groups: { side: string | null; items: { track: TrackItem; idx: number }[] }[] = [];
  tracklist.forEach((track, idx) => {
    const side = vinylSide(track.position);
    const last = groups[groups.length - 1];
    if (last && last.side === side) last.items.push({ track, idx });
    else groups.push({ side, items: [{ track, idx }] });
  });
  return groups;
}

function sideDuration(items: { track: TrackItem }[]): string | null {
  const seconds = items.map(({ track }) => durationToSeconds(track.duration));
  if (seconds.some((s) => s === null)) return null;
  const total = (seconds as number[]).reduce((a, b) => a + b, 0);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Tracklist del disco por caras: reproducir, BPM/Camelot y añadir a la mixtape en cada pista */
export const AlbumTracklist: React.FC<AlbumTracklistProps> = ({
  tracklist = [],
  player,
  isSongInMixtape,
  onAddToMixtape,
  onDeleteFromMixtape,
  mixtapeSelector,
}) => {
  const groups = groupBySide(tracklist);
  const totalSeconds = tracklist.reduce((sum, t) => sum + (durationToSeconds(t.duration) ?? 0), 0);

  return (
    <section className="tw-flex tw-flex-col tw-gap-6" aria-label="Tracklist">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <p className="tw-text-sm tw-text-gray-500">
          {tracklist.length === 1 ? "1 pista" : `${tracklist.length} pistas`}
          {totalSeconds > 0 && ` · ${formatSessionDuration(totalSeconds)}`}
          {player.tracks.length > 0 && ` · ${player.available} con audio`}
          {player.isLoading && " · buscando audio…"}
        </p>
        {mixtapeSelector}
      </div>

      {groups.map((group, groupIdx) => {
        const duration = sideDuration(group.items);
        return (
          <div key={`${group.side}-${groupIdx}`}>
            {group.side && (
              <div className="tw-flex tw-items-baseline tw-justify-between tw-px-2 tw-pb-2 tw-border-b tw-border-gray-200">
                <h2 className="tw-text-[15px] tw-font-bold tw-text-gray-900">Cara {group.side}</h2>
                {duration && <span className="tw-text-xs tw-text-gray-500 tw-tabular-nums">{duration}</span>}
              </div>
            )}
            <ol>
              {group.items.map(({ track, idx }) => {
                const inMixtape = isSongInMixtape(track.title);
                const playIndex = player.indexOf(track.position, track.title);
                const playable = playIndex >= 0 && player.isPlayable(playIndex);
                const isCurrent = playIndex >= 0 && playIndex === player.currentIndex;
                const source = playable ? player.tracks[playIndex]?.source : null;

                return (
                  <li
                    key={idx}
                    className={`tw-flex tw-items-center tw-gap-3 tw-px-2 tw-py-2 tw-border-b tw-border-gray-100 tw-rounded-md tw-transition-colors ${
                      isCurrent ? "tw-bg-brand-50" : "hover:tw-bg-gray-50"
                    }`}
                  >
                    {/* Posición / play */}
                    <button
                      type="button"
                      disabled={!playable}
                      onClick={() => player.toggleTrack(playIndex)}
                      className={`tw-group tw-w-9 tw-h-9 tw-shrink-0 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-mono tw-text-xs tw-font-semibold tw-transition-colors ${
                        isCurrent
                          ? "tw-bg-brand-600 tw-text-white"
                          : playable
                            ? "tw-text-gray-500 hover:tw-bg-brand-600 hover:tw-text-white"
                            : "tw-text-gray-300 tw-cursor-not-allowed"
                      }`}
                      title={playable ? (isCurrent && player.isPlaying ? "Pausar" : `Reproducir ${track.title}`) : "Sin audio disponible"}
                      aria-label={playable ? (isCurrent && player.isPlaying ? "Pausar" : `Reproducir ${track.title}`) : `${track.title}: sin audio`}
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

                    {/* Título (y, en el móvil, BPM y tono debajo) */}
                    <div className="tw-flex-1 tw-min-w-0">
                      <p className={`tw-text-sm tw-font-medium tw-truncate ${isCurrent ? "tw-text-brand-800" : "tw-text-gray-900"}`}>
                        {track.title}
                      </p>
                      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-mt-0.5">
                        <span className="sm:tw-hidden tw-flex tw-items-center tw-gap-1.5">
                          {track.tempo ? <span className="tw-font-mono tw-text-[11px] tw-text-gray-700">{Math.round(track.tempo)} BPM</span> : null}
                          <CamelotChip keyIndex={track.key} mode={track.mode} />
                        </span>
                        {source && (
                          <span className="tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-gray-400">{SOURCE_LABEL[source]}</span>
                        )}
                      </div>
                    </div>

                    <span className="tw-hidden sm:tw-block tw-w-16 tw-text-right tw-text-[13px] tw-font-medium tw-tabular-nums tw-text-gray-800">
                      {track.tempo ? `${Math.round(track.tempo)} BPM` : ""}
                    </span>
                    <span className="tw-hidden sm:tw-block tw-w-[68px]">
                      <CamelotChip keyIndex={track.key} mode={track.mode} />
                    </span>
                    <span className="tw-hidden sm:tw-block tw-w-11 tw-text-right tw-text-[13px] tw-text-gray-500 tw-tabular-nums">
                      {track.duration || ""}
                    </span>

                    {/* Mixtape */}
                    <button
                      type="button"
                      onClick={() => (inMixtape ? onDeleteFromMixtape(track) : onAddToMixtape(track))}
                      className={`tw-w-8 tw-h-8 tw-shrink-0 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-colors ${
                        inMixtape
                          ? "tw-bg-brand-600 tw-text-white hover:tw-bg-brand-700"
                          : "tw-border tw-border-gray-300 tw-bg-white tw-text-gray-600 hover:tw-border-brand-600 hover:tw-text-brand-700"
                      }`}
                      title={inMixtape ? "Quitar de la mixtape" : "Añadir a la mixtape"}
                      aria-label={inMixtape ? `Quitar «${track.title}» de la mixtape` : `Añadir «${track.title}» a la mixtape`}
                    >
                      {inMixtape ? <Check className="tw-w-4 tw-h-4" /> : <Plus className="tw-w-4 tw-h-4" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </section>
  );
};

export default AlbumTracklist;

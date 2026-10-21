import React from "react";
import Link from "next/link";
import { Play, Trash2, GripVertical, ChevronUp, ChevronDown, Disc3 } from "lucide-react";
import CamelotChip from "@/components/CamelotChip";

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
  vinyl_position?: string | null;
  data_checked_at?: string | null;
  album?: string | null;
  cover_url?: string | null;
};

/** Columnas de la tabla de la mixtape: la cabecera de la página usa las mismas. */
export const MIXTAPE_GRID =
  "tw-grid tw-items-center tw-gap-x-3 tw-grid-cols-[32px_minmax(0,1fr)_auto] md:tw-grid-cols-[40px_minmax(0,2fr)_minmax(0,1.2fr)_48px_52px_76px_48px_76px]";

type MixtapeRowProps = {
  data: MixtapeTrack;
  index: number;
  total: number;
  /** Sin reordenar (lista filtrada): sin asa ni flechas */
  canReorder: boolean;
  onMove: (from: number, to: number) => void;
  onDragStart: (index: number, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDelete: (track: MixtapeTrack) => void;
  onPlay: (track: MixtapeTrack) => void;
};

const iconButton =
  "tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-text-gray-500 hover:tw-text-gray-900 hover:tw-bg-gray-100 tw-transition-colors";

/** Fila de pista de la mixtape (docs/design.md §5, «Tabla de la mixtape»). */
export default function MixtapeRow({
  data,
  index,
  total,
  canReorder,
  onMove,
  onDragStart,
  onDragEnd,
  onDelete,
  onPlay,
}: MixtapeRowProps) {
  const bpm = data.tempo ? Math.round(data.tempo) : null;

  return (
    <div className={`${MIXTAPE_GRID} tw-group tw-px-2 tw-py-2 tw-rounded-lg hover:tw-bg-gray-50`}>
      {/* Número · reproducir al pasar el ratón */}
      <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-h-10">
        <span className="tw-font-mono tw-text-xs tw-text-gray-500 group-hover:tw-invisible">{index + 1}</span>
        <button
          type="button"
          onClick={() => onPlay(data)}
          aria-label={`Reproducir «${data.trackname}»`}
          className="tw-absolute tw-inset-0 tw-m-auto tw-w-8 tw-h-8 tw-rounded-full tw-bg-brand-600 tw-text-white tw-items-center tw-justify-center tw-hidden group-hover:tw-flex focus-visible:tw-flex"
        >
          <Play className="tw-w-3.5 tw-h-3.5 tw-fill-current" />
        </button>
      </div>

      {/* Portada, pista y artista (en el móvil, también cara, BPM y tono) */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
        {data.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.cover_url}
            alt=""
            loading="lazy"
            className="tw-w-10 tw-h-10 tw-rounded tw-object-cover tw-bg-gray-100 tw-shrink-0"
          />
        ) : (
          <span className="tw-w-10 tw-h-10 tw-rounded tw-bg-gray-100 tw-text-gray-400 tw-flex tw-items-center tw-justify-center tw-shrink-0">
            <Disc3 className="tw-w-5 tw-h-5" />
          </span>
        )}
        <div className="tw-min-w-0">
          <Link
            href={`/albums/${data.disco_id}`}
            className="tw-block tw-text-sm tw-font-semibold tw-text-gray-900 tw-truncate hover:tw-underline"
            title="Ver el disco"
          >
            {data.trackname}
          </Link>
          <span className="tw-block tw-text-[13px] tw-text-gray-500 tw-truncate">{data.artista}</span>
          <div className="md:tw-hidden tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-mt-1">
            {data.vinyl_position && (
              <span className="tw-font-mono tw-text-[11px] tw-font-semibold tw-text-gray-700 tw-bg-gray-100 tw-border tw-border-gray-200 tw-rounded tw-px-1">
                {data.vinyl_position}
              </span>
            )}
            {bpm && <span className="tw-font-mono tw-text-[11px] tw-text-gray-700">{bpm} BPM</span>}
            <CamelotChip keyIndex={data.key} mode={data.mode} />
          </div>
        </div>
      </div>

      {/* Columnas de escritorio */}
      <span className="tw-hidden md:tw-block tw-text-[13px] tw-text-gray-600 tw-truncate">{data.album || ""}</span>
      <span className="tw-hidden md:tw-block">
        {data.vinyl_position && (
          <span className="tw-font-mono tw-text-xs tw-font-semibold tw-text-gray-700 tw-bg-gray-100 tw-border tw-border-gray-200 tw-rounded-md tw-px-1.5 tw-py-0.5">
            {data.vinyl_position}
          </span>
        )}
      </span>
      <span className="tw-hidden md:tw-block tw-text-right tw-text-sm tw-font-medium tw-tabular-nums">{bpm ?? ""}</span>
      <span className="tw-hidden md:tw-block">
        <CamelotChip keyIndex={data.key} mode={data.mode} />
      </span>
      <span className="tw-hidden md:tw-block tw-text-right tw-text-[13px] tw-text-gray-500 tw-tabular-nums">
        {data.duration || ""}
      </span>

      {/* Reordenar y quitar */}
      <div className="tw-flex tw-items-center tw-justify-end tw-gap-0.5">
        {canReorder && (
          <>
            <span
              draggable
              onDragStart={(e) => onDragStart(index, e)}
              onDragEnd={onDragEnd}
              title="Arrastra para mover"
              className="tw-hidden md:tw-flex tw-w-8 tw-h-8 tw-items-center tw-justify-center tw-rounded-lg tw-text-gray-400 hover:tw-text-gray-700 tw-cursor-grab active:tw-cursor-grabbing md:tw-opacity-0 group-hover:tw-opacity-100"
            >
              <GripVertical className="tw-w-4 tw-h-4" />
            </span>
            <span className="md:tw-hidden tw-flex tw-flex-col">
              <button
                type="button"
                onClick={() => onMove(index, index - 1)}
                disabled={index === 0}
                aria-label={`Subir «${data.trackname}»`}
                className="tw-w-8 tw-h-6 tw-flex tw-items-center tw-justify-center tw-text-gray-500 disabled:tw-invisible"
              >
                <ChevronUp className="tw-w-4 tw-h-4" />
              </button>
              <button
                type="button"
                onClick={() => onMove(index, index + 1)}
                disabled={index === total - 1}
                aria-label={`Bajar «${data.trackname}»`}
                className="tw-w-8 tw-h-6 tw-flex tw-items-center tw-justify-center tw-text-gray-500 disabled:tw-invisible"
              >
                <ChevronDown className="tw-w-4 tw-h-4" />
              </button>
            </span>
          </>
        )}
        <button
          type="button"
          onClick={() => onDelete(data)}
          aria-label={`Quitar «${data.trackname}» de la mixtape`}
          title="Quitar de la mixtape"
          className={`${iconButton} hover:tw-text-red-600 hover:tw-bg-red-50 md:tw-opacity-0 group-hover:tw-opacity-100 focus-visible:tw-opacity-100`}
        >
          <Trash2 className="tw-w-4 tw-h-4" />
        </button>
      </div>
    </div>
  );
}

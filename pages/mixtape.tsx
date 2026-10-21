import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import useGetUserData from "@/hooks/useGetUserData";
import { deleteFromMixtape, reorderMixtape } from "@/services/client/mixtape";
import useMixtapes from "@/hooks/useMixtapes";
import useGetMixtape from "@/hooks/useGetMixtape";
import MixtapeManager from "@/components/MixtapeManager";
import MixtapeRow, { MixtapeTrack } from "@/components/MixtapeRow";
import CustomSnackbar from "@/components/CustomSnackbar";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import {
  Play,
  Bot,
  Disc,
  Search,
  Music2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Wand2,
  Undo2,
} from "lucide-react";
import { getPitchClassNotation } from "@/lib/musicNotation";
import { sortByHarmonyAndBpm } from "@/lib/mixtapeOrder";

export default function Mixtape() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBPM, setSearchBPM] = useState<number | null>(null);
  const [searchKey, setSearchKey] = useState<number | null>(null);
  const [searchMode, setSearchMode] = useState<number | null>(null);
  // Arrastre: pista que se mueve y fila sobre la que está
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // Orden anterior al automático, para poder deshacerlo
  const [autoUndo, setAutoUndo] = useState<{
    mixtapeId: number | null;
    tracks: MixtapeTrack[];
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  const { data: userData } = useGetUserData();
  const username = userData?.userProfile?.username || "";
  const router = useRouter();

  const mixtapes = useMixtapes(username);
  const {
    data: tracks,
    isLoading: tracksLoading,
    reload: reloadTracks,
    setData: setTracks,
  } = useGetMixtape(username, mixtapes.activeId);
  const mixtape = tracks as MixtapeTrack[];
  const loading = Boolean(username) && (mixtapes.isLoading || tracksLoading);
  const mixtapeName = mixtapes.active?.nombre || "Mi Mixtape";
  // Solo se puede deshacer en la mixtape que se ordenó
  const orderBeforeAuto =
    autoUndo && autoUndo.mixtapeId === (mixtapes.activeId ?? null) ? autoUndo.tracks : null;
  const playerHref = mixtapes.activeId ? `/mixtapeplayer?id=${mixtapes.activeId}` : "/mixtapeplayer";

  const handleOpenSnackbar = (message: string) => {
    setSnackbar({ isOpen: true, message });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  async function handleDelete(track: MixtapeTrack) {
    try {
      await deleteFromMixtape(
        track.username,
        mixtapes.activeId ?? null,
        track.artista,
        track.trackname,
        track.disco_id
      );
      await Promise.all([reloadTracks(), mixtapes.reload()]);
      handleOpenSnackbar(`"${track.trackname}" eliminada de «${mixtapeName}».`);
    } catch (error) {
      console.error("Error eliminando tema de Mixtape:", error);
      handleOpenSnackbar("Hubo un error al eliminar la canción.");
    }
  }

  /** Muestra el orden nuevo al instante y lo guarda; si falla, recarga el guardado. */
  async function saveOrder(ordered: MixtapeTrack[]) {
    setTracks(ordered);
    try {
      await reorderMixtape(username, mixtapes.activeId ?? null, ordered);
    } catch (error: any) {
      console.error("Error guardando el orden de la Mixtape:", error);
      handleOpenSnackbar(error?.message || "No se pudo guardar el orden.");
      setAutoUndo(null);
      await reloadTracks();
    }
  }

  function moveTrack(from: number, to: number) {
    if (from === to || to < 0 || to >= mixtape.length) return;
    const ordered = [...mixtape];
    const [track] = ordered.splice(from, 1);
    ordered.splice(to, 0, track);
    setAutoUndo(null);
    saveOrder(ordered);
  }

  function handleAutoOrder() {
    const ordered = sortByHarmonyAndBpm(mixtape);
    if (ordered.every((t, i) => t === mixtape[i])) {
      handleOpenSnackbar("La sesión ya está ordenada por armonía y BPM.");
      return;
    }
    setAutoUndo({ mixtapeId: mixtapes.activeId ?? null, tracks: mixtape });
    saveOrder(ordered);
    handleOpenSnackbar("Sesión ordenada por armonía y BPM.");
  }

  function handleUndoAutoOrder() {
    if (!orderBeforeAuto) return;
    const previous = orderBeforeAuto;
    setAutoUndo(null);
    saveOrder(previous);
  }

  function endDrag() {
    setDragIndex(null);
    setOverIndex(null);
  }

  const filteredMixtape = mixtape.filter((track) => {
      const lower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        track.trackname.toLowerCase().includes(lower) ||
        track.artista.toLowerCase().includes(lower);

      const matchesKey =
        searchKey === null ||
        (track.key === searchKey && (searchMode === null || track.mode === searchMode));

      const matchesBpm = !searchBPM || track.tempo === searchBPM;

      return matchesSearch && matchesKey && matchesBpm;
  });
  // Con filtros la lista está incompleta: reordenar solo tiene sentido sobre la sesión entera
  const isFiltered = filteredMixtape.length !== mixtape.length;

  if (loading) {
    return (
      <Layout centeredContent={true} title="Cargando Mixtape...">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[50vh]">
          <CustomCircularProgress />
          <p className="tw-mt-4 tw-text-sm tw-text-gray-500">
            Cargando tus vinilos y pistas de la mixtape...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      centeredTopContent={true}
      title="Mi Mixtape de Vinilos | Diskogs +"
      description="Tu selección personalizada de pistas y mezcla armónica para DJs de vinilo"
    >
      <div className="tw-container tw-mx-auto tw-max-w-6xl tw-p-4 md:tw-p-6">
        {/* Cabecera Principal */}
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-mb-6">
          <div>
            <h1 className="tw-text-2xl md:tw-text-3xl tw-font-extrabold tw-text-gray-900 dark:tw-text-white tw-tracking-tight">
              {mixtapeName}
            </h1>
            <p className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400 tw-mt-1">
              {mixtape.length} canciones seleccionadas para mezcla y escucha continua
            </p>
          </div>

          {/* Botones de Acción Principales */}
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            {mixtape.length > 0 && (
              <>
                <Link
                  href={playerHref}
                  className="tw-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-xl tw-bg-vinyl-500 hover:tw-bg-vinyl-600 tw-text-white tw-font-bold tw-text-sm tw-shadow-md hover:tw-shadow-lg tw-transition-all"
                >
                  <Play className="tw-w-4 tw-h-4 tw-fill-current" />
                  <span>Reproducir Mixtape (YouTube)</span>
                </Link>

                <Link
                  href={`/chat?username=${encodeURIComponent(username)}&artista=Mixtape&album=Mixtape%20Personal`}
                  className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2.5 tw-rounded-xl tw-bg-brand-100 dark:tw-bg-brand-950/50 tw-text-brand-700 dark:tw-text-brand-300 hover:tw-bg-brand-200 dark:hover:tw-bg-brand-900/60 tw-font-semibold tw-text-sm tw-border tw-border-brand-200 dark:tw-border-brand-800 tw-transition-colors"
                >
                  <Bot className="tw-w-4 tw-h-4" />
                  <span>Analizar Armonía con DiscBOT</span>
                </Link>
              </>
            )}

            <Link
              href="/albums"
              className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2.5 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-700 dark:tw-text-gray-200 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800 tw-text-sm tw-font-medium tw-transition-colors"
            >
              <Disc className="tw-w-4 tw-h-4" />
              <span>Añadir más vinilos</span>
            </Link>
          </div>
        </div>

        {mixtapes.mixtapes && (
          <MixtapeManager
            mixtapes={mixtapes.mixtapes}
            activeId={mixtapes.activeId}
            onSelect={mixtapes.setActiveId}
            onChanged={mixtapes.reload}
            onMessage={handleOpenSnackbar}
          />
        )}

        {/* Estado Vacío */}
        {mixtape.length === 0 ? (
          <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-3xl tw-p-10 tw-text-center tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-max-w-lg tw-mx-auto tw-my-12">
            <div className="tw-w-16 tw-h-16 tw-rounded-2xl tw-bg-vinyl-100 dark:tw-bg-vinyl-950/50 tw-text-vinyl-600 tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
              <Music2 className="tw-w-8 tw-h-8" />
            </div>
            <h2 className="tw-text-xl tw-font-bold tw-text-gray-900 dark:tw-text-white tw-mb-2">
              «{mixtapeName}» está vacía
            </h2>
            <p className="tw-text-sm tw-text-gray-500 tw-mb-6">
              Navega por los vinilos de tu catálogo y pulsa el botón &quot;+ Mixtape&quot; en las pistas que quieras incluir en tu sesión.
            </p>
            <Link
              href="/albums"
              className="tw-inline-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-xl tw-bg-vinyl-500 hover:tw-bg-vinyl-600 tw-text-white tw-font-medium tw-text-sm tw-transition-colors tw-shadow-md"
            >
              <Disc className="tw-w-4 tw-h-4" />
              <span>Explorar Catálogo de Vinilos</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Barra de Filtros y Búsqueda */}
            <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-4 tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-mb-6 tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-items-stretch md:tw-items-center">
              {/* Input de Búsqueda */}
              <div className="tw-relative tw-flex-1">
                <Search className="tw-w-4 tw-h-4 tw-text-gray-400 tw-absolute tw-left-3.5 tw-top-1/2 tw--translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por artista o canción en tu mixtape..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tw-w-full tw-pl-10 tw-pr-4 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white placeholder:tw-text-gray-400 tw-outline-none focus:tw-border-vinyl-500 focus:tw-ring-2 focus:tw-ring-vinyl-500/20"
                />
              </div>

              {/* Filtro por Rueda Camelot */}
              <div className="tw-w-full md:tw-w-64">
                <select
                  value={
                    searchKey !== null && searchMode !== null
                      ? `${searchKey}-${searchMode}`
                      : "all"
                  }
                  onChange={(e) => {
                    if (e.target.value === "all") {
                      setSearchKey(null);
                      setSearchMode(null);
                    } else {
                      const [k, m] = e.target.value.split("-").map(Number);
                      setSearchKey(k);
                      setSearchMode(m);
                    }
                  }}
                  className="tw-w-full tw-px-3.5 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white tw-outline-none focus:tw-border-vinyl-500"
                >
                  <option value="all">Todas las tonalidades (Camelot)</option>
                  {Array.from({ length: 12 }).map((_, keyIdx) =>
                    [1, 0].map((modeIdx) => {
                      const notation = getPitchClassNotation(keyIdx, modeIdx);
                      return (
                        <option
                          key={`${keyIdx}-${modeIdx}`}
                          value={`${keyIdx}-${modeIdx}`}
                        >
                          {notation.full}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* Orden automático por armonía y BPM (se guarda) */}
              <div className="tw-flex tw-items-center tw-gap-2">
                <button
                  type="button"
                  onClick={handleAutoOrder}
                  disabled={mixtape.length < 2}
                  className="tw-flex tw-flex-1 md:tw-flex-none tw-items-center tw-justify-center tw-gap-1.5 tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-semibold tw-bg-vinyl-500 hover:tw-bg-vinyl-600 tw-text-white tw-border tw-border-vinyl-600 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                  title="Encadena las pistas por la rueda Camelot y de menos a más BPM"
                >
                  <Wand2 className="tw-w-4 tw-h-4" />
                  <span>Ordenar por armonía y BPM</span>
                </button>
                {orderBeforeAuto && (
                  <button
                    type="button"
                    onClick={handleUndoAutoOrder}
                    className="tw-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-2 tw-rounded-xl tw-text-sm tw-font-medium tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-700 dark:tw-text-gray-200 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700 tw-transition-colors"
                    title="Volver al orden anterior"
                  >
                    <Undo2 className="tw-w-4 tw-h-4" />
                    <span>Deshacer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Filas de Mixtape */}
            <div className="tw-space-y-3">
              {isFiltered && (
                <p className="tw-text-xs tw-text-gray-500 dark:tw-text-gray-400 tw-px-1">
                  Quita los filtros para reordenar la sesión.
                </p>
              )}
              {filteredMixtape.length === 0 ? (
                <div className="tw-text-center tw-p-8 tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-500">
                  No se encontraron canciones que coincidan con los filtros aplicados.
                </div>
              ) : (
                filteredMixtape.map((track, index) => (
                  <div
                    key={`${track.artista}-${track.trackname}-${track.disco_id}`}
                    data-mixtape-row
                    onDragOver={(e) => {
                      if (dragIndex === null) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overIndex !== index) setOverIndex(index);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex !== null) moveTrack(dragIndex, index);
                      endDrag();
                    }}
                    className={`tw-rounded-2xl tw-transition-opacity ${
                      dragIndex === index ? "tw-opacity-40" : ""
                    } ${
                      overIndex === index && dragIndex !== null && dragIndex !== index
                        ? "tw-ring-2 tw-ring-vinyl-400"
                        : ""
                    }`}
                  >
                    <MixtapeRow
                      data={track}
                      onDelete={handleDelete}
                      onPlay={() => router.push(playerHref)}
                      leading={
                        isFiltered ? undefined : (
                          <>
                            <button
                              type="button"
                              onClick={() => moveTrack(index, index - 1)}
                              disabled={index === 0}
                              className="tw-p-0.5 tw-rounded tw-text-gray-400 hover:tw-text-gray-700 dark:hover:tw-text-gray-200 disabled:tw-invisible"
                              title="Subir"
                              aria-label={`Subir «${track.trackname}»`}
                            >
                              <ChevronUp className="tw-w-4 tw-h-4" />
                            </button>
                            <span
                              draggable
                              onDragStart={(e) => {
                                setDragIndex(index);
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", String(index));
                                const row = e.currentTarget.closest("[data-mixtape-row]");
                                if (row) e.dataTransfer.setDragImage(row, 24, 24);
                              }}
                              onDragEnd={endDrag}
                              className="tw-flex tw-flex-col tw-items-center tw-cursor-grab active:tw-cursor-grabbing tw-text-gray-400 hover:tw-text-gray-700 dark:hover:tw-text-gray-200"
                              title="Arrastra para mover"
                            >
                              <span className="tw-text-xs tw-font-bold tw-tabular-nums">{index + 1}</span>
                              <GripVertical className="tw-w-4 tw-h-4" />
                            </span>
                            <button
                              type="button"
                              onClick={() => moveTrack(index, index + 1)}
                              disabled={index === filteredMixtape.length - 1}
                              className="tw-p-0.5 tw-rounded tw-text-gray-400 hover:tw-text-gray-700 dark:hover:tw-text-gray-200 disabled:tw-invisible"
                              title="Bajar"
                              aria-label={`Bajar «${track.trackname}»`}
                            >
                              <ChevronDown className="tw-w-4 tw-h-4" />
                            </button>
                          </>
                        )
                      }
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <CustomSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        onClose={handleCloseSnackbar}
      />
    </Layout>
  );
}

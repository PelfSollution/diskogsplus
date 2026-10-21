import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import useGetUserData from "@/hooks/useGetUserData";
import {
  deleteFromMixtape,
  reorderMixtape,
  mixtapeChatHref,
  completeMixtapeTracks,
} from "@/services/client/mixtape";
import useMixtapes from "@/hooks/useMixtapes";
import useGetMixtape from "@/hooks/useGetMixtape";
import MixtapeManager from "@/components/MixtapeManager";
import MixtapeRow, { MixtapeTrack, MIXTAPE_GRID } from "@/components/MixtapeRow";
import VinylDisc from "@/components/VinylDisc";
import CustomSnackbar from "@/components/CustomSnackbar";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import { Play, Bot, Disc3, Search, Wand2, Undo2, Gauge, TriangleAlert, Loader2 } from "lucide-react";
import { getPitchClassNotation } from "@/lib/musicNotation";
import { sortByHarmonyAndBpm } from "@/lib/mixtapeOrder";
import { durationToSeconds, formatSessionDuration, sameRecordWarning } from "@/lib/vinyl";

export default function Mixtape() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBPM, setSearchBPM] = useState<number | null>(null);
  const [searchKey, setSearchKey] = useState<number | null>(null);
  const [searchMode, setSearchMode] = useState<number | null>(null);
  const [isFillingData, setIsFillingData] = useState(false);
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
  const mixtapeName = mixtapes.active?.nombre || "Mi mixtape";

  // ?id= desde la barra lateral: esa mixtape pasa a ser la activa
  const queryId = Number(router.query.id);
  const { setActiveId } = mixtapes;
  useEffect(() => {
    if (Number.isInteger(queryId) && mixtapes.mixtapes?.some((m) => m.id === queryId)) {
      setActiveId(queryId);
    }
  }, [queryId, mixtapes.mixtapes, setActiveId]);
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

  async function handleCompleteTracks() {
    if (mixtapes.activeId == null) return;
    setIsFillingData(true);
    try {
      const { revisadas, actualizadas } = await completeMixtapeTracks(mixtapes.activeId);
      await reloadTracks();
      handleOpenSnackbar(
        actualizadas > 0
          ? `Datos encontrados para ${actualizadas} de ${revisadas} pistas.`
          : "No se han encontrado datos nuevos en Discogs, ReccoBeats ni Deezer."
      );
    } catch (error: any) {
      console.error("Error completando los datos de las pistas:", error);
      handleOpenSnackbar(error?.message || "No se pudieron buscar los datos.");
    } finally {
      setIsFillingData(false);
    }
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
  // Pistas a las que les faltan datos. BPM, tono y cara: solo si aún no se han
  // buscado (las revisadas sin resultado no vuelven a avisar). Disco y portada
  // (columnas de oct. 2026): siempre, porque Discogs casi siempre los tiene.
  const missingDataCount = mixtape.filter(
    (t) =>
      !t.album ||
      !t.cover_url ||
      (!t.data_checked_at &&
        (t.tempo == null || t.key == null || t.mode == null || t.vinyl_position == null))
  ).length;

  // Resumen de la sesión: discos distintos, rango de BPM y portadas para la galleta
  const discCount = new Set(mixtape.map((t) => t.disco_id)).size;
  const tempos = mixtape.map((t) => t.tempo).filter((t): t is number => typeof t === "number" && t > 0);
  const minBpm = tempos.length ? Math.round(Math.min(...tempos)) : null;
  const maxBpm = tempos.length ? Math.round(Math.max(...tempos)) : null;
  const covers = Array.from(new Set(mixtape.map((t) => t.cover_url).filter(Boolean))) as string[];

  // Duración de la sesión con las pistas que la tienen
  const durations = mixtape.map((t) => durationToSeconds(t.duration));
  const totalSeconds = durations.reduce<number>((sum, d) => sum + (d ?? 0), 0);
  const tracksWithoutDuration = durations.filter((d) => d === null).length;

  // Con filtros la lista está incompleta: reordenar solo tiene sentido sobre la sesión entera
  const isFiltered = filteredMixtape.length !== mixtape.length;

  if (loading) {
    return (
      <Layout centeredContent={true} title="Cargando mixtape…">
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
          <CustomCircularProgress />
          <p className="tw-text-sm tw-text-gray-500">Cargando la mixtape…</p>
        </div>
      </Layout>
    );
  }

  const outlineButton =
    "tw-flex tw-items-center tw-gap-2 tw-h-11 tw-px-4 tw-rounded-full tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-medium tw-text-gray-900 hover:tw-bg-gray-50 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed";

  return (
    <Layout
      centeredTopContent={true}
      title={`${mixtapeName} | Diskogs+`}
      description="Tu selección de pistas y mezcla armónica para DJs de vinilo"
    >
      <div className="tw-max-w-6xl tw-mx-auto tw-px-4 md:tw-px-10 tw-py-8 md:tw-py-10 tw-flex tw-flex-col tw-gap-8">
        {/* Cabecera: vinilo con las portadas, título, resumen y acciones */}
        <header className="tw-flex tw-flex-wrap tw-items-end tw-gap-x-9 tw-gap-y-6">
          <VinylDisc size={176} covers={covers} spinning={mixtape.length > 0} className="tw-hidden sm:tw-flex" />

          <div className="tw-flex-1 tw-basis-80 tw-min-w-0 tw-flex tw-flex-col tw-gap-3">
            <Link
              href="/mixtapes"
              className="tw-self-start tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-brand-700 hover:tw-underline"
            >
              Mixtapes
            </Link>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
              <h1 className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-tracking-tight tw-text-gray-900">{mixtapeName}</h1>
              {mixtapes.mixtapes && (
                <MixtapeManager
                  active={mixtapes.active}
                  createRequested={router.query.nueva === "1"}
                  onCreateClosed={() => {
                    if (router.query.nueva) router.replace("/mixtape", undefined, { shallow: true });
                  }}
                  onSelect={mixtapes.setActiveId}
                  onChanged={mixtapes.reload}
                  onMessage={handleOpenSnackbar}
                />
              )}
            </div>
            <p className="tw-text-sm tw-text-gray-500">
              {mixtape.length === 1 ? "1 pista" : `${mixtape.length} pistas`}
              {discCount > 0 && ` · ${discCount === 1 ? "1 disco" : `${discCount} discos`}`}
              {totalSeconds > 0 && (
                <>
                  {" · "}
                  {formatSessionDuration(totalSeconds)}
                  {tracksWithoutDuration > 0 && ` (${tracksWithoutDuration} sin duración)`}
                </>
              )}
              {minBpm !== null && maxBpm !== null && ` · ${minBpm === maxBpm ? `${minBpm} BPM` : `de ${minBpm} a ${maxBpm} BPM`}`}
            </p>

            {mixtape.length > 0 && (
              <div className="tw-flex tw-flex-wrap tw-gap-2.5 tw-mt-2">
                <Link
                  href={playerHref}
                  className="tw-flex tw-items-center tw-gap-2 tw-h-11 tw-px-5 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-sm tw-font-semibold tw-transition-colors"
                >
                  <Play className="tw-w-4 tw-h-4 tw-fill-current" />
                  Reproducir
                </Link>
                <button
                  type="button"
                  onClick={handleAutoOrder}
                  disabled={mixtape.length < 2}
                  className={outlineButton}
                  title="Encadena las pistas por la rueda Camelot y de menos a más BPM"
                >
                  <Wand2 className="tw-w-4 tw-h-4" />
                  Ordenar por armonía y BPM
                </button>
                {orderBeforeAuto && (
                  <button type="button" onClick={handleUndoAutoOrder} className={outlineButton} title="Volver al orden anterior">
                    <Undo2 className="tw-w-4 tw-h-4" />
                    Deshacer
                  </button>
                )}
                <Link href={mixtapeChatHref(username, mixtapes.activeId, mixtapeName)} className={outlineButton}>
                  <Bot className="tw-w-4 tw-h-4" />
                  Analizar con DiscBOT
                </Link>
              </div>
            )}
          </div>

          {/* Curva de BPM: una barra por pista, en el orden de la sesión */}
          {tempos.length > 1 && minBpm !== null && maxBpm !== null && (
            <figure className="tw-hidden lg:tw-flex tw-flex-col tw-gap-2 tw-w-56">
              <figcaption className="tw-text-xs tw-text-gray-500">Curva de BPM</figcaption>
              <div
                role="img"
                aria-label={`BPM de cada pista, de ${minBpm} a ${maxBpm}`}
                className="tw-h-16 tw-flex tw-items-end tw-gap-1"
              >
                {mixtape.map((t, i) => {
                  const range = Math.max(maxBpm - minBpm, 1);
                  const height = t.tempo ? 20 + ((t.tempo - minBpm) / range) * 80 : 6;
                  return (
                    <span
                      key={`${t.disco_id}-${t.trackname}-${i}`}
                      title={`${i + 1}. ${t.trackname}${t.tempo ? ` · ${Math.round(t.tempo)} BPM` : ""}`}
                      className={`tw-flex-1 tw-rounded-t tw-rounded-b-sm ${t.tempo ? "tw-bg-brand-300" : "tw-bg-gray-200"}`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </figure>
          )}
        </header>

        {mixtape.length === 0 ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-text-center tw-gap-4 tw-py-16 tw-border tw-border-dashed tw-border-gray-300 tw-rounded-2xl">
            <VinylDisc size={96} flat />
            <div>
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">«{mixtapeName}» está vacía</h2>
              <p className="tw-text-sm tw-text-gray-500 tw-mt-1 tw-max-w-sm">
                Abre un disco de tu colección y pulsa «+» en las pistas que quieras pinchar.
              </p>
            </div>
            <Link
              href="/albums"
              className="tw-flex tw-items-center tw-gap-2 tw-h-11 tw-px-5 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-sm tw-font-semibold"
            >
              <Disc3 className="tw-w-4 tw-h-4" />
              Ir a la colección
            </Link>
          </div>
        ) : (
          <section className="tw-flex tw-flex-col tw-gap-4">
            {/* Pistas sin datos (solo con Supabase) */}
            {missingDataCount > 0 && mixtapes.activeId != null && (
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-rounded-xl tw-bg-brand-50 tw-border tw-border-brand-100">
                <p className="tw-text-sm tw-text-brand-900">
                  {missingDataCount === 1
                    ? "A 1 pista le faltan datos"
                    : `A ${missingDataCount} pistas les faltan datos`}{" "}
                  (portada, cara, BPM o tonalidad).
                </p>
                <button
                  type="button"
                  onClick={handleCompleteTracks}
                  disabled={isFillingData}
                  className="tw-flex tw-items-center tw-gap-1.5 tw-h-9 tw-px-3.5 tw-rounded-lg tw-text-sm tw-font-semibold tw-bg-white tw-text-brand-800 tw-border tw-border-brand-200 hover:tw-bg-brand-100 tw-transition-colors disabled:tw-opacity-60 disabled:tw-cursor-wait"
                >
                  {isFillingData ? <Loader2 className="tw-w-4 tw-h-4 tw-animate-spin" /> : <Gauge className="tw-w-4 tw-h-4" />}
                  {isFillingData ? "Buscando…" : "Completar datos"}
                </button>
              </div>
            )}

            {/* Filtros */}
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <div className="tw-relative tw-flex-1 tw-min-w-[220px]">
                <Search className="tw-w-4 tw-h-4 tw-text-gray-400 tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2" />
                <input
                  type="search"
                  placeholder="Buscar pista o artista"
                  aria-label="Buscar pista o artista"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tw-w-full tw-h-10 tw-pl-9 tw-pr-3 tw-text-sm tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-gray-900 placeholder:tw-text-gray-400 tw-outline-none focus:tw-border-brand-600 focus:tw-ring-2 focus:tw-ring-brand-600/20"
                />
              </div>
              <select
                aria-label="Filtrar por tonalidad"
                value={searchKey !== null && searchMode !== null ? `${searchKey}-${searchMode}` : "all"}
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
                className="tw-h-10 tw-px-3 tw-text-sm tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-gray-900 tw-outline-none focus:tw-border-brand-600"
              >
                <option value="all">Todas las tonalidades</option>
                {Array.from({ length: 12 }).map((_, keyIdx) =>
                  [1, 0].map((modeIdx) => {
                    const notation = getPitchClassNotation(keyIdx, modeIdx);
                    return (
                      <option key={`${keyIdx}-${modeIdx}`} value={`${keyIdx}-${modeIdx}`}>
                        {notation.camelotCode} · {notation.note} {modeIdx === 1 ? "mayor" : "menor"}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Tabla de pistas */}
            <div>
              <div className={`${MIXTAPE_GRID} tw-hidden md:tw-grid tw-px-2 tw-pb-2 tw-border-b tw-border-gray-200 tw-text-xs tw-text-gray-500`}>
                <span className="tw-text-center">#</span>
                <span>Pista</span>
                <span>Disco</span>
                <span>Cara</span>
                <span className="tw-text-right">BPM</span>
                <span>Tono</span>
                <span className="tw-text-right">Dur.</span>
                <span className="tw-sr-only">Acciones</span>
              </div>

              {isFiltered && (
                <p className="tw-text-xs tw-text-gray-500 tw-px-2 tw-pt-2">Quita los filtros para reordenar la sesión.</p>
              )}

              {filteredMixtape.length === 0 ? (
                <p className="tw-text-center tw-text-sm tw-text-gray-500 tw-py-10">
                  Ninguna pista coincide con los filtros.
                </p>
              ) : (
                filteredMixtape.map((track, index) => {
                  const warning = !isFiltered ? sameRecordWarning(filteredMixtape[index - 1], track) : null;
                  return (
                    <div
                      key={`${track.artista}-${track.trackname}-${track.disco_id}`}
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
                      data-mixtape-row
                      className={`tw-border-b tw-border-gray-100 tw-transition-opacity ${dragIndex === index ? "tw-opacity-40" : ""} ${
                        overIndex === index && dragIndex !== null && dragIndex !== index
                          ? "tw-rounded-lg tw-ring-2 tw-ring-brand-400"
                          : ""
                      }`}
                    >
                      {warning && (
                        <p className="tw-flex tw-items-center tw-gap-1.5 tw-pt-2 tw-pl-2 md:tw-pl-[60px] tw-text-xs tw-font-medium tw-text-brand-800">
                          <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-bg-brand-50 tw-rounded-full tw-px-2.5 tw-py-1">
                            <TriangleAlert className="tw-w-3.5 tw-h-3.5 tw-shrink-0" />
                            {warning}
                          </span>
                        </p>
                      )}
                      <MixtapeRow
                        data={track}
                        index={index}
                        total={filteredMixtape.length}
                        canReorder={!isFiltered}
                        onMove={moveTrack}
                        onDragStart={(i, e) => {
                          setDragIndex(i);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", String(i));
                          const row = (e.currentTarget as HTMLElement).closest("[data-mixtape-row]");
                          if (row) e.dataTransfer.setDragImage(row, 24, 24);
                        }}
                        onDragEnd={endDrag}
                        onDelete={handleDelete}
                        onPlay={() => router.push(playerHref)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>

      <CustomSnackbar isOpen={snackbar.isOpen} message={snackbar.message} onClose={handleCloseSnackbar} />
    </Layout>
  );
}

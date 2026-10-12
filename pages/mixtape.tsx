import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import useGetUserData from "@/hooks/useGetUserData";
import { deleteFromMixtape } from "@/services/client/mixtape";
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
  ArrowUpDown,
  Music2,
  Trash2,
  Filter,
} from "lucide-react";
import { CAMELOT_CODES, getPitchClassNotation } from "@/lib/musicNotation";

export default function Mixtape() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBPM, setSearchBPM] = useState<number | null>(null);
  const [searchKey, setSearchKey] = useState<number | null>(null);
  const [searchMode, setSearchMode] = useState<number | null>(null);
  const [bpmOrder, setBpmOrder] = useState<"ASC" | "DESC" | null>(null);
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
  } = useGetMixtape(username, mixtapes.activeId);
  const mixtape = tracks as MixtapeTrack[];
  const loading = Boolean(username) && (mixtapes.isLoading || tracksLoading);
  const mixtapeName = mixtapes.active?.nombre || "Mi Mixtape";
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

  const toggleBpmOrder = () => {
    if (bpmOrder === null || bpmOrder === "DESC") {
      setBpmOrder("ASC");
    } else {
      setBpmOrder("DESC");
    }
  };

  const filteredAndSortedMixtape = [...mixtape]
    .filter((track) => {
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
    })
    .sort((a, b) => {
      if (!bpmOrder) return 0;
      return bpmOrder === "DESC"
        ? (a.tempo ?? 0) - (b.tempo ?? 0)
        : (b.tempo ?? 0) - (a.tempo ?? 0);
    });

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

              {/* Ordenar por BPM */}
              <button
                type="button"
                onClick={toggleBpmOrder}
                className={`tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-semibold tw-border tw-transition-colors ${
                  bpmOrder
                    ? "tw-bg-vinyl-500 tw-text-white tw-border-vinyl-600"
                    : "tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-700 dark:tw-text-gray-300 tw-border-gray-200 dark:tw-border-gray-700 hover:tw-bg-gray-100"
                }`}
                title="Ordenar por BPM"
              >
                <ArrowUpDown className="tw-w-4 tw-h-4" />
                <span>
                  {bpmOrder === "ASC"
                    ? "BPM: Menor a Mayor"
                    : bpmOrder === "DESC"
                    ? "BPM: Mayor a Menor"
                    : "Ordenar BPM"}
                </span>
              </button>
            </div>

            {/* Lista de Filas de Mixtape */}
            <div className="tw-space-y-3">
              {filteredAndSortedMixtape.length === 0 ? (
                <div className="tw-text-center tw-p-8 tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-500">
                  No se encontraron canciones que coincidan con los filtros aplicados.
                </div>
              ) : (
                filteredAndSortedMixtape.map((track) => (
                  <MixtapeRow
                    key={`${track.artista}-${track.trackname}-${track.disco_id}`}
                    data={track}
                    onDelete={handleDelete}
                    onPlay={() => router.push(playerHref)}
                  />
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

import React, { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useGetUserData from "@/hooks/useGetUserData";
import type { WantlistEntry } from "@/services/supabase/getWantlistItemsUser";
import { getWantlist } from "@/services/client/userData";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { Search, ArrowUpDown, Download, Disc } from "lucide-react";
import AlbumCoverCard, { COVER_GRID } from "@/components/AlbumCoverCard";

function Wantlist() {
  const { data: userData } = useGetUserData();
  const username = userData?.userProfile?.username;
  const [wantlistItems, setWantlistItems] = useState<WantlistEntry[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"name" | "album">("name");
  const [orderAsc, setOrderAsc] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handleOpenSnackbar = (message: string) => {
    setSnackbar({ isOpen: true, message });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  const handleImportWantlist = async () => {
    setIsImporting(true);
    handleOpenSnackbar("Sincronizando Wantlist con Discogs...");
    try {
      const response = await fetch("/api/albums/importWantlistFromDiscogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (!response.ok) {
        handleOpenSnackbar(data?.message || "No se pudo importar la Wantlist de Discogs.");
      } else if (data.added > 0) {
        setWantlistItems(await getWantlist());
        handleOpenSnackbar(`${data.added} discos nuevos importados de Discogs.`);
      } else {
        handleOpenSnackbar("Tu Wantlist ya estaba al día con Discogs.");
      }
    } catch {
      handleOpenSnackbar("No se pudo conectar con Discogs para importar la Wantlist.");
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    getWantlist()
      .then((items) => {
        setWantlistItems(items || []);
      })
      .catch((err) => {
        setWantlistItems([]);
        setError(err);
      });
  }, [username]);

  const lowercasedSearchTerm = useMemo(
    () => searchTerm.toLowerCase(),
    [searchTerm]
  );

  const filteredItems = useMemo(() => {
    return (wantlistItems || [])
      .filter((item: WantlistEntry) => {
        if (!item) return false;
        const albumMatches = (item.album || "")
          .toLowerCase()
          .includes(lowercasedSearchTerm);
        const artistMatches = (item.artista || "")
          .toLowerCase()
          .includes(lowercasedSearchTerm);
        return albumMatches || artistMatches;
      })
      .sort((a, b) => {
        switch (filter) {
          case "name": {
            const artistA = a.artista || "";
            const artistB = b.artista || "";
            return orderAsc
              ? artistA.localeCompare(artistB)
              : artistB.localeCompare(artistA);
          }
          case "album": {
            const titleA = a.album || "";
            const titleB = b.album || "";
            return orderAsc
              ? titleA.localeCompare(titleB)
              : titleB.localeCompare(titleA);
          }
          default:
            return 0;
        }
      });
  }, [wantlistItems, lowercasedSearchTerm, filter, orderAsc]);

  const isLoading = !wantlistItems && !error;

  if (isLoading) {
    return (
      <Layout centeredContent={true} title="Cargando Wantlist...">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[60vh]">
          <CustomCircularProgress />
          <p className="tw-mt-4 tw-text-sm tw-text-gray-500">
            Cargando tu Wantlist de vinilos...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      centeredContent={false}
      title="Mi Wantlist de Vinilos | Diskogs +"
      description="Los discos de vinilo que estás buscando y deseas añadir a tu colección"
    >
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 md:tw-px-10 tw-py-8 md:tw-py-10 tw-flex tw-flex-col tw-gap-8">
        {/* Cabecera */}
        <header className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4">
          <div>
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-brand-700">Wantlist</span>
            <h1 className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-tracking-tight tw-text-gray-900 tw-mt-1">Discos que buscas</h1>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
              {wantlistItems ? (wantlistItems.length === 1 ? "1 disco" : `${wantlistItems.length} discos`) : "Cargando…"}
            </p>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-w-full sm:tw-w-auto">
            <div className="tw-relative tw-flex-1 sm:tw-w-64">
              <Search className="tw-w-4 tw-h-4 tw-text-gray-400 tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2" />
              <input
                type="search"
                aria-label={filter === "name" ? "Buscar por artista" : "Buscar por disco"}
                placeholder={filter === "name" ? "Buscar artista" : "Buscar disco"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tw-w-full tw-h-10 tw-pl-9 tw-pr-3 tw-text-sm tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-gray-900 placeholder:tw-text-gray-400 tw-outline-none focus:tw-border-brand-600 focus:tw-ring-2 focus:tw-ring-brand-600/20"
              />
            </div>
            <select
              aria-label="Buscar y ordenar por"
              value={filter}
              onChange={(e) => setFilter(e.target.value as "name" | "album")}
              className="tw-h-10 tw-px-3 tw-text-sm tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-gray-900 tw-outline-none focus:tw-border-brand-600"
            >
              <option value="name">Artista</option>
              <option value="album">Disco</option>
            </select>
            <button
              type="button"
              onClick={() => setOrderAsc(!orderAsc)}
              className="tw-flex tw-items-center tw-gap-1.5 tw-h-10 tw-px-3 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
              title="Invertir el orden"
            >
              <ArrowUpDown className="tw-w-4 tw-h-4" />
              {orderAsc ? "A → Z" : "Z → A"}
            </button>
            <button
              type="button"
              onClick={handleImportWantlist}
              disabled={isImporting}
              className="tw-flex tw-items-center tw-gap-2 tw-h-10 tw-px-4 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 disabled:tw-opacity-50 tw-text-white tw-text-sm tw-font-semibold tw-transition-colors"
            >
              <Download className="tw-w-4 tw-h-4" />
              {isImporting ? "Importando…" : "Importar de Discogs"}
            </button>
          </div>
        </header>

        {filteredItems.length === 0 ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-text-center tw-gap-3 tw-py-16 tw-border tw-border-dashed tw-border-gray-300 tw-rounded-2xl">
            <Disc className="tw-w-10 tw-h-10 tw-text-gray-400" />
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
              {searchTerm ? "No hay discos con esa búsqueda" : "Tu wantlist está vacía"}
            </h2>
            <p className="tw-text-sm tw-text-gray-500 tw-max-w-sm">
              {searchTerm
                ? "Prueba con otro nombre o cambia entre artista y disco."
                : "Importa tu wantlist de Discogs con el botón de arriba o añade discos desde «Comparar colecciones»."}
            </p>
          </div>
        ) : (
          <div className={COVER_GRID}>
            {filteredItems.map((item: WantlistEntry) => (
              <AlbumCoverCard
                key={item.disco_id}
                href={`/albums/${item.disco_id}`}
                cover={item.image_url}
                title={item.album || "Disco sin título"}
                artist={removeAllSubstringsInParenthesis(item.artista || "Artista desconocido")}
              />
            ))}
          </div>
        )}

        <CustomSnackbar
          isOpen={snackbar.isOpen}
          message={snackbar.message}
          onClose={handleCloseSnackbar}
        />
      </div>
    </Layout>
  );
}

export default Wantlist;

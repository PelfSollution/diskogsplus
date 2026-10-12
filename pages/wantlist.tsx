import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useGetUserData from "@/hooks/useGetUserData";
import type { WantlistEntry } from "@/services/supabase/getWantlistItemsUser";
import { getWantlist } from "@/services/client/userData";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import {
  Bookmark,
  Search,
  ArrowUpDown,
  Filter,
  Download,
  Disc,
} from "lucide-react";

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
      <div className="tw-container tw-mx-auto tw-max-w-7xl tw-p-4 md:tw-p-6">
        {/* Cabecera */}
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-mb-6">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2.5">
              <div className="tw-w-10 tw-h-10 tw-rounded-xl tw-bg-brand-100 dark:tw-bg-brand-950/50 tw-text-brand-600 dark:tw-text-brand-400 tw-flex tw-items-center tw-justify-center">
                <Bookmark className="tw-w-5 tw-h-5" />
              </div>
              <h1 className="tw-text-2xl md:tw-text-3xl tw-font-extrabold tw-text-gray-900 dark:tw-text-white tw-tracking-tight">
                Mi Wantlist
              </h1>
            </div>
            <p className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400 tw-mt-1">
              {wantlistItems ? `${wantlistItems.length} vinilos deseados` : "Cargando..."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleImportWantlist}
            disabled={isImporting}
            className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2.5 tw-rounded-xl tw-bg-brand-600 hover:tw-bg-brand-700 disabled:tw-opacity-50 tw-text-white tw-font-semibold tw-text-sm tw-transition-colors tw-shadow-sm"
          >
            <Download className="tw-w-4 tw-h-4" />
            <span>{isImporting ? "Importando de Discogs..." : "Importar de Discogs"}</span>
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-4 tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-mb-8 tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-items-stretch sm:tw-items-center">
          <div className="tw-flex tw-items-center tw-gap-2 tw-bg-gray-50 dark:tw-bg-gray-900 tw-px-3 tw-py-2 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 sm:tw-w-48">
            <Filter className="tw-w-4 tw-h-4 tw-text-gray-400 tw-shrink-0" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "name" | "album")}
              className="tw-w-full tw-bg-transparent tw-text-sm tw-font-medium tw-text-gray-900 dark:tw-text-white tw-outline-none"
            >
              <option value="name">Por Artista</option>
              <option value="album">Por Disco</option>
            </select>
          </div>

          <div className="tw-relative tw-flex-1">
            <Search className="tw-w-4 tw-h-4 tw-text-gray-400 tw-absolute tw-left-3.5 tw-top-1/2 tw--translate-y-1/2" />
            <input
              type="text"
              placeholder={filter === "name" ? "Buscar por artista en wantlist..." : "Buscar por título de disco..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tw-w-full tw-pl-10 tw-pr-4 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white placeholder:tw-text-gray-400 tw-outline-none focus:tw-border-brand-500 focus:tw-ring-2 focus:tw-ring-brand-500/20"
            />
          </div>

          <button
            type="button"
            onClick={() => setOrderAsc(!orderAsc)}
            className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-semibold tw-border tw-transition-colors ${
              orderAsc
                ? "tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-700 dark:tw-text-gray-300 tw-border-gray-200 dark:tw-border-gray-700 hover:tw-bg-gray-100"
                : "tw-bg-brand-600 tw-text-white tw-border-brand-700"
            }`}
            title={orderAsc ? "Orden alfabético A-Z" : "Orden alfabético Z-A"}
          >
            <ArrowUpDown className="tw-w-4 tw-h-4" />
            <span>{orderAsc ? "A → Z" : "Z → A"}</span>
          </button>
        </div>

        {/* Cuadrícula de Wantlist */}
        {filteredItems.length === 0 ? (
          <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-3xl tw-p-10 tw-text-center tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-max-w-md tw-mx-auto tw-my-12">
            <Disc className="tw-w-12 tw-h-12 tw-text-gray-400 tw-mx-auto tw-mb-3" />
            <h3 className="tw-text-lg tw-font-bold tw-text-gray-900 dark:tw-text-white tw-mb-1">
              Tu Wantlist está vacía
            </h3>
            <p className="tw-text-sm tw-text-gray-500 tw-mb-5">
              Navega por los discos del catálogo y pulsa el botón de &quot;Añadir a Wantlist&quot; o pulsa arriba para importar tu lista de Discogs.
            </p>
            <Link
              href="/albums"
              className="tw-inline-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-xl tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-font-semibold tw-text-sm tw-transition-colors"
            >
              <Disc className="tw-w-4 tw-h-4" />
              <span>Explorar Vinilos</span>
            </Link>
          </div>
        ) : (
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6">
            {filteredItems.map((item: WantlistEntry) => {
              const artistName = removeAllSubstringsInParenthesis(item.artista || "Artista Desconocido");

              return (
                <Link
                  key={item.disco_id}
                  href={`/albums/${item.disco_id}`}
                  className="tw-group tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-overflow-hidden tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-xs hover:tw-shadow-xl tw-transition-all tw-duration-300 tw-flex tw-flex-col"
                >
                  <div className="tw-relative tw-w-full tw-h-56 tw-bg-gray-100 dark:tw-bg-gray-900 tw-overflow-hidden">
                    <Image
                      src={item.image_url || "/no-portada.gif"}
                      alt={item.album}
                      fill
                      className="tw-object-cover group-hover:tw-scale-105 tw-transition-transform tw-duration-500"
                    />
                  </div>

                  <div className="tw-p-4 tw-flex-1 tw-flex tw-flex-col tw-justify-between">
                    <div>
                      <span className="tw-text-xs tw-font-bold tw-text-brand-600 dark:tw-text-brand-400 tw-block tw-truncate">
                        {artistName}
                      </span>
                      <h3
                        className="tw-text-sm tw-font-extrabold tw-text-gray-900 dark:tw-text-white tw-truncate tw-mt-1"
                        title={item.album}
                      >
                        {item.album}
                      </h3>
                    </div>

                    <div className="tw-flex tw-items-center tw-justify-between tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100 dark:tw-border-gray-750">
                      <span className="tw-text-[11px] tw-text-brand-500 tw-font-semibold">
                        ★ En tu Wantlist
                      </span>
                      <span className="tw-text-xs tw-font-semibold tw-text-gray-400 group-hover:tw-text-brand-500 tw-transition-colors">
                        Ver ficha →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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

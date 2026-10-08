import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useGetAlbumList from "@/hooks/useGetAlbumList";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { Artist, Album } from "@/types/types";
import {
  Search,
  ArrowUpDown,
  Disc,
  Filter,
  Layers,
} from "lucide-react";

function Albums() {
  const {
    data: albums,
    isLoading,
    error,
    size,
    setSize,
    totalPagesVinyl,
  } = useGetAlbumList();

  const allAlbums = useMemo(() => {
    return albums ? albums.flatMap((page) => page.releases) : [];
  }, [albums]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"name" | "album">("name");
  const [orderAsc, setOrderAsc] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });

  const lowercasedSearchTerm = useMemo(
    () => searchTerm.toLowerCase(),
    [searchTerm]
  );

  const filteredAlbums = useMemo(() => {
    return (allAlbums || [])
      .filter((album) => {
        if (!album || !album.basic_information) {
          return false;
        }
        const titleMatches = album.basic_information.title
          .toLowerCase()
          .includes(lowercasedSearchTerm);
        const artistMatches = album.basic_information.artists.some(
          (artist: Artist) =>
            artist.name.toLowerCase().includes(lowercasedSearchTerm)
        );
        return titleMatches || artistMatches;
      })
      .sort((a, b) => {
        switch (filter) {
          case "name": {
            const artistA = a.basic_information.artists[0]?.name || "";
            const artistB = b.basic_information.artists[0]?.name || "";
            return orderAsc
              ? artistA.localeCompare(artistB)
              : artistB.localeCompare(artistA);
          }
          case "album": {
            const titleA = a.basic_information.title;
            const titleB = b.basic_information.title;
            return orderAsc
              ? titleA.localeCompare(titleB)
              : titleB.localeCompare(titleA);
          }
          default:
            return 0;
        }
      });
  }, [allAlbums, lowercasedSearchTerm, filter, orderAsc]);

  const loadMoreAlbums = () => {
    mostrarMensaje("Cargando más discos...");
    setSize(size + 1);
  };

  const allAlbumsAreValid = filteredAlbums.every(
    (album) => album && album.id && album.basic_information
  );

  const mostrarMensaje = (message: string) => {
    setSnackbar({ isOpen: true, message });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  if (isLoading) {
    return (
      <Layout centeredContent={true} title="Cargando Discos...">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[60vh]">
          <CustomCircularProgress />
          <p className="tw-mt-4 tw-text-sm tw-text-gray-500">
            Cargando catálogo de vinilos desde Discogs...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !allAlbums) {
    return (
      <Layout centeredContent={true} title="Error al cargar">
        <div className="tw-text-center tw-p-8 tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-max-w-md tw-mx-auto tw-my-12">
          <p className="tw-text-red-500 tw-font-semibold tw-mb-4">
            Error al cargar los álbumes desde Discogs.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="tw-px-4 tw-py-2 tw-rounded-xl tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-sm tw-font-medium"
          >
            Reintentar
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      centeredContent={false}
      title="Catálogo de Discos de Vinilo | Diskogs +"
      description="Explora tu colección de vinilos con datos de Discogs, BPM y análisis musical"
    >
      <div className="tw-container tw-mx-auto tw-max-w-7xl tw-p-4 md:tw-p-6">
        {/* Cabecera */}
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-mb-6">
          <div>
            <h1 className="tw-text-2xl md:tw-text-3xl tw-font-extrabold tw-text-gray-900 dark:tw-text-white tw-tracking-tight">
              Catálogo de Vinilos
            </h1>
            <p className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400 tw-mt-1">
              {filteredAlbums.length} álbumes disponibles en tu colección
            </p>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros con diseño moderno en Tailwind */}
        <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-4 tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-mb-8 tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-items-stretch sm:tw-items-center">
          {/* Selector de campo de filtrado */}
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

          {/* Campo de búsqueda */}
          <div className="tw-relative tw-flex-1">
            <Search className="tw-w-4 tw-h-4 tw-text-gray-400 tw-absolute tw-left-3.5 tw-top-1/2 tw--translate-y-1/2" />
            <input
              type="text"
              placeholder={filter === "name" ? "Buscar por artista..." : "Buscar por título de disco..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tw-w-full tw-pl-10 tw-pr-4 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white placeholder:tw-text-gray-400 tw-outline-none focus:tw-border-brand-500 focus:tw-ring-2 focus:tw-ring-brand-500/20"
            />
          </div>

          {/* Botón de ordenación A-Z / Z-A */}
          <button
            type="button"
            onClick={() => setOrderAsc(!orderAsc)}
            className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-2 tw-rounded-xl tw-text-sm tw-font-semibold tw-border tw-transition-colors ${
              orderAsc
                ? "tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-700 dark:tw-text-gray-300 tw-border-gray-200 dark:tw-border-gray-700 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800"
                : "tw-bg-brand-500 tw-text-white tw-border-brand-600"
            }`}
            title={orderAsc ? "Orden alfabético A-Z (clic para invertir)" : "Orden alfabético Z-A"}
          >
            <ArrowUpDown className="tw-w-4 tw-h-4" />
            <span>{orderAsc ? "A → Z" : "Z → A"}</span>
          </button>
        </div>

        {/* Cuadrícula de Vinilos */}
        {filteredAlbums.length === 0 ? (
          <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-3xl tw-p-10 tw-text-center tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-max-w-md tw-mx-auto tw-my-12">
            <Disc className="tw-w-12 tw-h-12 tw-text-gray-400 tw-mx-auto tw-mb-3" />
            <h3 className="tw-text-lg tw-font-bold tw-text-gray-900 dark:tw-text-white tw-mb-1">
              No se encontraron vinilos
            </h3>
            <p className="tw-text-sm tw-text-gray-500">
              Prueba a cambiar el término de búsqueda o el tipo de filtro.
            </p>
          </div>
        ) : (
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6">
            {filteredAlbums.map((album: Album) => {
              if (!album || !album.id || !album.basic_information) {
                return null;
              }

              const artistName =
                album.basic_information.artists && album.basic_information.artists.length > 0
                  ? removeAllSubstringsInParenthesis(album.basic_information.artists[0].name)
                  : "Artista Desconocido";

              return (
                <Link
                  key={album.id}
                  href={`/albums/${album.id}`}
                  className="tw-group tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-overflow-hidden tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-xs hover:tw-shadow-xl tw-transition-all tw-duration-300 tw-flex tw-flex-col"
                >
                  <div className="tw-relative tw-w-full tw-h-56 tw-bg-gray-100 dark:tw-bg-gray-900 tw-overflow-hidden">
                    <Image
                      src={album.basic_information.cover_image || "/no-portada.gif"}
                      alt={album.basic_information.title}
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
                        title={album.basic_information.title}
                      >
                        {album.basic_information.title}
                      </h3>
                    </div>

                    <div className="tw-flex tw-items-center tw-justify-between tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100 dark:tw-border-gray-750">
                      <span className="tw-text-[11px] tw-text-gray-400">
                        Edición LP
                      </span>
                      <span className="tw-text-xs tw-font-semibold tw-text-brand-500 group-hover:tw-translate-x-0.5 tw-transition-transform">
                        Ver detalles →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Botón Cargar Más */}
        {searchTerm === "" && allAlbumsAreValid && size < totalPagesVinyl && (
          <div className="tw-flex tw-justify-center tw-mt-10">
            <button
              type="button"
              onClick={loadMoreAlbums}
              className="tw-px-6 tw-py-2.5 tw-rounded-xl tw-bg-gray-900 dark:tw-bg-white hover:tw-bg-gray-800 dark:hover:tw-bg-gray-100 tw-text-white dark:tw-text-gray-900 tw-font-semibold tw-text-sm tw-transition-colors tw-shadow-sm"
            >
              Cargar más Discos
            </button>
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

export default Albums;

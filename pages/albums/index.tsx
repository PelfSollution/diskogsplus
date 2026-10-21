import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import VinylDisc from "@/components/VinylDisc";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useGetAlbumList from "@/hooks/useGetAlbumList";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { Artist, Album } from "@/types/types";
import { Search, ArrowUpDown, Disc } from "lucide-react";

function Albums() {
  const {
    data: albums,
    isLoading,
    error,
    size,
    setSize,
    totalPagesVinyl,
    totalDiscos,
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
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 md:tw-px-10 tw-py-8 md:tw-py-10 tw-flex tw-flex-col tw-gap-8">
        {/* Cabecera */}
        <header className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4">
          <div>
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-brand-700">Colección</span>
            <h1 className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-tracking-tight tw-text-gray-900 tw-mt-1">Tus vinilos</h1>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
              {totalDiscos
                ? `${filteredAlbums.length} de ${totalDiscos} discos cargados`
                : `${filteredAlbums.length} discos`}
            </p>
          </div>

          {/* Búsqueda, campo y orden */}
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-w-full sm:tw-w-auto">
            <div className="tw-relative tw-flex-1 sm:tw-w-72">
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
          </div>
        </header>

        {/* Cuadrícula de portadas */}
        {filteredAlbums.length === 0 ? (
          <div className="tw-flex tw-flex-col tw-items-center tw-text-center tw-gap-3 tw-py-16 tw-border tw-border-dashed tw-border-gray-300 tw-rounded-2xl">
            <Disc className="tw-w-10 tw-h-10 tw-text-gray-400" />
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">No hay discos con esa búsqueda</h2>
            <p className="tw-text-sm tw-text-gray-500">Prueba con otro nombre o cambia entre artista y disco.</p>
          </div>
        ) : (
          <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 lg:tw-grid-cols-4 xl:tw-grid-cols-5 tw-gap-x-6 tw-gap-y-8">
            {filteredAlbums.map((album: Album) => {
              if (!album || !album.id || !album.basic_information) {
                return null;
              }

              const artistName =
                album.basic_information.artists && album.basic_information.artists.length > 0
                  ? removeAllSubstringsInParenthesis(album.basic_information.artists[0].name)
                  : "Artista desconocido";
              const cover = album.basic_information.cover_image || "/no-portada.gif";

              return (
                <Link key={album.id} href={`/albums/${album.id}`} className="tw-group tw-flex tw-flex-col tw-gap-2.5">
                  {/* Portada; al pasar el ratón asoma el vinilo por detrás */}
                  <div className="tw-relative tw-aspect-square">
                    <div className="tw-absolute tw-inset-[4%] tw-transition-transform tw-duration-500 tw-ease-out group-hover:tw-translate-x-[22%]">
                      <VinylDisc size="fill" cover={cover} flat />
                    </div>
                    <div className="tw-relative tw-w-full tw-h-full tw-rounded-md tw-overflow-hidden tw-bg-gray-100 tw-shadow-sm group-hover:tw-shadow-lg tw-transition-shadow">
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="tw-object-cover"
                      />
                    </div>
                  </div>
                  <div className="tw-min-w-0">
                    <h2 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-truncate" title={album.basic_information.title}>
                      {album.basic_information.title}
                    </h2>
                    <p className="tw-text-[13px] tw-text-gray-500 tw-truncate">{artistName}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Cargar más */}
        {searchTerm === "" && allAlbumsAreValid && size < totalPagesVinyl && (
          <div className="tw-flex tw-justify-center">
            <button
              type="button"
              onClick={loadMoreAlbums}
              className="tw-h-11 tw-px-6 tw-rounded-full tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-900 hover:tw-bg-gray-50"
            >
              Cargar más discos
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

import React, { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useCompareAlbumList from "@/hooks/useCompareAlbumList";
import useGetUserData from "@/hooks/useGetUserData";
import { removeAllSubstringsInParenthesis } from "@/lib/stringUtils";
import { Users2, ArrowRight, Disc, Layers } from "lucide-react";

interface Artist {
  name: string;
}

interface Album {
  id: number;
  basic_information: {
    cover_image: string;
    artists: Artist[];
    title: string;
    created_at: string;
  };
}

export default function Comparador() {
  const { data: userData } = useGetUserData();
  const [user1InputValue, setUser1InputValue] = useState("");
  const user1 = userData?.userProfile?.username;
  const [user2, setUser2] = useState("");
  const [comparePressed, setComparePressed] = useState(false);
  const [comparedUser, setComparedUser] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (userData?.userProfile?.username) {
      setUser1InputValue(userData.userProfile.username);
    }
  }, [userData]);

  const {
    data: albumsDifference,
    isLoading,
    error,
  } = useCompareAlbumList(comparedUser, user1, currentPage);

  const getDisplayedAlbums = () => {
    const start = (currentPage - 1) * 50;
    const end = start + 50;
    if (albumsDifference && albumsDifference[0]) {
      return albumsDifference[0].slice(start, end);
    }
    return [];
  };

  const displayedAlbums = getDisplayedAlbums();

  const handleOpenSnackbar = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
  };

  const resetComparison = () => {
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handleCompare = (e: FormEvent) => {
    e.preventDefault();
    if (!user2.trim()) {
      handleOpenSnackbar("Por favor, introduce el nombre del usuario a comparar.");
      return;
    }
    setComparedUser(user2.trim());
    setComparePressed(true);
  };

  return (
    <Layout
      centeredTopContent={true}
      title="Comparador de Colecciones | Diskogs +"
      description="Compara tu colección de vinilos con la de otros usuarios de Discogs"
    >
      <div className="tw-container tw-mx-auto tw-max-w-6xl tw-p-4 md:tw-p-6">
        {/* Cabecera */}
        <div className="tw-mb-8 tw-text-center">
          <div className="tw-inline-flex tw-items-center tw-justify-center tw-w-12 tw-h-12 tw-rounded-2xl tw-bg-brand-100 dark:tw-bg-brand-950/50 tw-text-brand-600 tw-mb-3">
            <Users2 className="tw-w-6 tw-h-6" />
          </div>
          <h1 className="tw-text-2xl md:tw-text-3xl tw-font-extrabold tw-text-gray-900 dark:tw-text-white">
            Comparador de Vinilos
          </h1>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1 tw-max-w-md tw-mx-auto">
            Descubre qué discos tiene otro coleccionista que aún faltan en tu estantería.
          </p>
        </div>

        {/* Formulario de Comparación */}
        <form
          onSubmit={handleCompare}
          className="tw-bg-white dark:tw-bg-gray-800 tw-p-6 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-max-w-xl tw-mx-auto tw-mb-8"
        >
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mb-5">
            <div>
              <label className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 dark:tw-text-gray-300 tw-mb-1.5">
                Tu usuario (Discogs):
              </label>
              <input
                type="text"
                disabled
                value={user1InputValue || user1 || "Cargando..."}
                className="tw-w-full tw-px-3.5 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-100 dark:tw-bg-gray-900 tw-text-gray-500 tw-cursor-not-allowed"
              />
            </div>

            <div>
              <label className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 dark:tw-text-gray-300 tw-mb-1.5">
                Usuario a comparar:
              </label>
              <input
                type="text"
                placeholder="Ej. vinyl_lover_99"
                value={user2}
                onChange={(e) => {
                  setUser2(e.target.value);
                  setComparePressed(false);
                  resetComparison();
                }}
                className="tw-w-full tw-px-3.5 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white tw-outline-none focus:tw-border-brand-500 focus:tw-ring-2 focus:tw-ring-brand-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2.5 tw-px-4 tw-rounded-xl tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-font-bold tw-text-sm tw-transition-colors tw-shadow-md"
          >
            <span>Comparar Colecciones</span>
            <ArrowRight className="tw-w-4 tw-h-4" />
          </button>
        </form>

        {/* Estado de Carga */}
        {comparePressed && isLoading && (
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-my-12">
            <CustomCircularProgress />
            <p className="tw-mt-4 tw-text-sm tw-text-gray-500">
              Analizando y comparando ambas colecciones desde Discogs...
            </p>
          </div>
        )}

        {/* Resultados */}
        {comparePressed && !isLoading && albumsDifference && (
          <div>
            <div className="tw-bg-brand-50 dark:tw-bg-brand-950/30 tw-border tw-border-brand-200 dark:tw-border-brand-800 tw-rounded-2xl tw-p-4 tw-mb-6 tw-text-sm tw-text-brand-900 dark:tw-text-brand-200 tw-flex tw-items-center tw-justify-between">
              <div>
                Vinilos que tiene <strong>{user2}</strong> y que te faltan a ti:
              </div>
              <span className="tw-text-lg tw-font-extrabold tw-bg-brand-500 tw-text-white tw-px-3 tw-py-0.5 tw-rounded-xl">
                {albumsDifference[0]?.length || 0}
              </span>
            </div>

            {/* Cuadrícula de Álbumes */}
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-5">
              {displayedAlbums.map((album: Album, index: number) => {
                const artistName =
                  album.basic_information.artists && album.basic_information.artists.length > 0
                    ? removeAllSubstringsInParenthesis(album.basic_information.artists[0].name)
                    : "Artista Desconocido";

                return (
                  <Link
                    key={`${album.id}-${index}`}
                    href={`/albums/${album.id}?from=compare`}
                    className="tw-group tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-overflow-hidden tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-xs hover:tw-shadow-xl tw-transition-all tw-duration-300 tw-flex tw-flex-col"
                  >
                    <div className="tw-relative tw-w-full tw-h-52 tw-bg-gray-100 dark:tw-bg-gray-900 tw-overflow-hidden">
                      <Image
                        src={album.basic_information.cover_image || "/no-portada.gif"}
                        alt={album.basic_information.title}
                        fill
                        className="tw-object-cover group-hover:tw-scale-105 tw-transition-transform tw-duration-500"
                      />
                    </div>

                    <div className="tw-p-4 tw-flex-1 tw-flex tw-flex-col tw-justify-between">
                      <div>
                        <span className="tw-text-xs tw-font-semibold tw-text-brand-600 dark:tw-text-brand-400 tw-block tw-truncate">
                          {artistName}
                        </span>
                        <h3 className="tw-text-sm tw-font-bold tw-text-gray-900 dark:tw-text-white tw-truncate tw-mt-0.5" title={album.basic_information.title}>
                          {album.basic_information.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Botón Cargar Más */}
            {displayedAlbums.length > 0 &&
              currentPage * 50 < (albumsDifference[0]?.length || 0) && (
                <div className="tw-text-center tw-mt-8">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="tw-px-6 tw-py-2.5 tw-rounded-xl tw-bg-gray-900 dark:tw-bg-white hover:tw-bg-gray-800 dark:hover:tw-bg-gray-100 tw-text-white dark:tw-text-gray-900 tw-font-semibold tw-text-sm tw-transition-colors"
                  >
                    Cargar más vinilos
                  </button>
                </div>
              )}
          </div>
        )}
      </div>

      <CustomSnackbar
        isOpen={snackbarOpen}
        message={snackbarMessage}
        onClose={() => setSnackbarOpen(false)}
      />
    </Layout>
  );
}

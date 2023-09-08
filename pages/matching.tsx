import React, { useState, useEffect, FormEvent } from "react";
import useCompareAlbumList from "@/hooks/useCompareAlbumList";
import useGetUserData from "@/hooks/useGetUserData";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import Link from "next/link";
import Image from "next/image";
import {
  TextField,
  Button,
  Snackbar,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

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
    size,
    setSize,
  } = useCompareAlbumList(comparedUser, user1);

  const getDisplayedAlbums = () => {
    const start = (currentPage - 1) * 50;
    const end = start + 50;
    if (albumsDifference) {
      return albumsDifference[0].slice(start, end);
    }
    return []; // o cualquier valor predeterminado que quieras devolver en caso de que albumsDifference sea undefined
  };


  useEffect(() => {
    if (comparePressed && error) {
      setSnackbarMessage("Usuario no encontrado, sin colección o privada"); //poner emojis
      setSnackbarOpen(true);
    }
  }, [error, comparePressed]);
  

  console.log("DIFERENCIA:", albumsDifference);

  const handleLoadMore = () => {
    setCurrentPage(currentPage + 1);
  };
// solo al clicar sino hacia peticion al escribir
 const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  console.log("Botón clicado, Usuario para comparar:", user2);
  setComparedUser(user2);
  setComparePressed(true);
};

const resetComparison = () => {
  setComparePressed(false);
  setComparedUser("");
};



const handleCloseSnackbar = () => {
  setSnackbarOpen(false);
};




  return (
    <Layout centeredContent={false}  title="Matching - Diskogs +"
    description="Matching entre colleciones de Discos">
      <div className="tw-container tw-mx-auto tw-p-6">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Matching</h1>
        <form onSubmit={handleSubmit} className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-2">
            <TextField
           label="Tu usuario"
           variant="outlined"
           fullWidth
           value={user1InputValue}
           disabled={true}
           className="tw-mb-4"
           id="user1"
           autoComplete="off"
           size="small"
            />
          </div>
          <div>
            <p className="tw-font-bold">
              Comparar coleccion de vinilos con el usuario:
            </p>
          </div>
          <div className="tw-flex tw-flex-col tw-gap-2">
            <TextField
            label="Usuario:"
            variant="outlined"
            fullWidth
            value={user2}
            onChange={(e) => {
              setUser2(e.target.value);
              setComparePressed(false);
              resetComparison();
            }}
            className="tw-mb-4"
            id="user2"
            size="small"
            />
          </div>
          <Button type="submit" variant="outlined">
            Comparar colecciones de Discos
          </Button>
        </form>

        {comparePressed && isLoading && (
          <Layout centeredTopContent={true}>
            <CustomCircularProgress />
          </Layout>
        )}


        {comparePressed && !isLoading && albumsDifference && (
          <div>
            <p className="tw-mb-4 tw-mt-4">
              Discos que <span className="tw-font-bold">{user1}</span> tiene y{" "}
              <span className="tw-font-bold">{user2}</span> no tiene:{" "}
              <span className="tw-font-bold tw-text-blue-500">
                {albumsDifference[0].length}
              </span>
            </p>

            <ul>
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
                {Array.isArray(getDisplayedAlbums()) &&
  getDisplayedAlbums().map((album: Album) => (
                    <li key={`${album.id}-${album.basic_information.title}`}>
                      <Link href={`/albums/${album.id}?from=compare`} passHref>
                        <div className="tw-bg-white tw-p-4 tw-rounded tw-shadow tw-cursor-pointer">
                          <Image
                            src={album.basic_information.cover_image}
                            alt={album.basic_information.title}
                            width={500}
                            height={240}
                            className="tw-w-full tw-h-48 tw-object-cover tw-mb-2 tw-rounded"
                          />
                          <h2 className="tw-text-xl">
                            <span className="tw-font-bold">
                              {album.basic_information.artists &&
                              album.basic_information.artists.length > 0
                                ? album.basic_information.artists[0].name
                                : "Artista desconocido"}
                            </span>
                            - {album.basic_information.title}
                          </h2>
                        </div>
                      </Link>
                    </li>
                  ))}
              </div>
            </ul>
            {/* Mostrar el botón "Cargar más" si es necesario */}
            {getDisplayedAlbums().length && (currentPage * 50) < albumsDifference[0].length && (
  <button
    onClick={handleLoadMore}
    className="tw-mt-4 tw-w-full tw-bg-blue-500 tw-text-white tw-py-2 tw-rounded-full"
  >
    Cargar más Discos
  </button>
)}
          </div>
        )}

<Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000} // Duración en milisegundos
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon />
          </IconButton>
        }
      />

      </div>


    </Layout>
  );
}

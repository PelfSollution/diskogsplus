import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import getMixtape from "../services/supabase/getMixtape";
import useGetUserData from "@/hooks/useGetUserData";
import deleteFromMixtape from "../services/supabase/deleteFromMixtape";

import { CircularProgress, Snackbar } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

type Mixtape = {
  id: number;
  username: string;
  artistname: string;
  trackname: string;
  discogsalbumid: string;
  spotifytrackid?: string | null;
};

type SpotifyPlayerProps = {
  spotifyTrackId: string;
};

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  spotifyTrackId,
}) => {
  const embedUrl = `https://open.spotify.com/embed/track/${spotifyTrackId}`;

  return (
    <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        width="300"
        height="80"
        frameBorder="0"
        allow="encrypted-media"
      ></iframe>
    </div>
  );
};

export default function Mixtape() {
  const [mixtape, setMixtapes] = useState<Mixtape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { data: userData } = useGetUserData();

  const handleOpenSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  async function handleDelete(track: Mixtape) {
    try {
      await deleteFromMixtape(
        track.username,
        track.artistname,
        track.trackname,
        track.discogsalbumid
      );
      setMixtapes((prevMixtape) =>
        prevMixtape.filter((item) => item.id !== track.id)
      );

      handleOpenSnackbar(
        `Canción "${track.trackname}" de "${track.artistname}" eliminada de la mixtape con éxito.`
      );
    } catch (error) {
      console.error("Error eliminando el tema:", error);
      // Podrías mostrar una notificación al usuario aquí, indicando el error.
    }
  }

  useEffect(() => {
    async function fetchData() {
      const username = userData?.userProfile?.username;

      if (!username) {
        console.error("No se pudo obtener el username del usuario.");
        return;
      }

      try {
        const data = await getMixtape(username);

        setMixtapes(data);
      } catch (err) {
        console.error("Error obteniendo datos:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (userData) {
      fetchData();
    }
  }, [userData]);

  console.log("userData", userData);

  if (loading) {
    return (
      <Layout>
        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
          <CircularProgress />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="tw-border tw-border-gray-200">
        {/* Cabecera */}
        <div className="tw-flex tw-border-b tw-p-2 tw-bg-gray-100">
          <div className="tw-flex-1 tw-font-bold">ARTISTA</div>
          <div className="tw-flex-1 tw-font-bold">CANCIÓN</div>
          <div className="tw-flex-1 tw-font-bold">SPOTIFY</div>
          <div className="tw-flex-1 tw-font-bold">USUARIO</div>
        </div>

        {/* Cuerpo */}
        {mixtape.length === 0 ? (
          <div className="tw-p-2">No hay datos disponibles</div>
        ) : (
          mixtape.map((data) => (
            <div key={data.id} className="tw-flex tw-border-b tw-p-2">
              <div className="tw-flex-1 tw-font-bold">{data.artistname}</div>
              <div className="tw-flex-1 tw-italic tw-text-left">
                {data.trackname}
              </div>
              <div className="tw-flex-1">
                {data.spotifytrackid ? (
                  <SpotifyPlayer spotifyTrackId={data.spotifytrackid} />
                ) : (
                  "No está en Spotify"
                )}
              </div>
              <div className="tw-flex-1 tw-italic tw-text-left">
                {data.username}
              </div>

              {/* Aquí va el botón de eliminación */}
              <div className="tw-flex tw-justify-center tw-items-center tw-flex-none">
                <button
                  className="tw-text-red-600 tw-border tw-border-red-600 tw-px-2 tw-py-1 tw-rounded"
                  onClick={() => handleDelete(data)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={openSnackbar}
        autoHideDuration={3000} // Duración en milisegundos
        onClose={handleCloseSnackbar}
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
    </Layout>
  );
}

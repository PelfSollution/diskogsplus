import { useState, useEffect, memo } from "react";
import Layout from "@/components/Layout";
import getMixtape from "../services/supabase/getMixtape";
import useGetUserData from "@/hooks/useGetUserData";
import deleteFromMixtape from "../services/supabase/deleteFromMixtape";
import MixtapeRow from "@/components/MixtapeRow";
import { Snackbar } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import { getKeyNotation } from "../lib/musicNotation";

type Mixtape = {
  id: number;
  username: string;
  artistname: string;
  trackname: string;
  discogsalbumid: string;
  spotifytrackid?: string | null;
  tempo?: number | null;
  key?: number | null;
  mode?: number | null;
  duration?: string | null;
};

type SpotifyPlayerProps = {
  spotifyTrackId: string;
};

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = memo(
  ({ spotifyTrackId }) => {
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
  }
);
SpotifyPlayer.displayName = "SpotifyPlayer";

export default function Mixtape() {
  const [mixtape, setMixtape] = useState<Mixtape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { data: userData } = useGetUserData();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBPM, setSearchBPM] = useState<number | null>(null);
  const [searchKey, setSearchKey] = useState<number | null>(null);
  const [bpmOrder, setBpmOrder] = useState<"ASC" | "DESC" | null>(null);

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
      setMixtape((prevMixtape) =>
        prevMixtape.filter((item) => item.id !== track.id)
      );

      handleOpenSnackbar(
        `Canción "${track.trackname}" de "${track.artistname}" eliminada de la mixtape con éxito.`
      );
    } catch (error) {
      console.error("Error eliminando el tema:", error);
      handleOpenSnackbar(
        `Hubo un error al eliminar la canción "${track.trackname}" de "${track.artistname}". Por favor, intenta nuevamente.`
      );
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

        setMixtape(data);
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

  if (loading) {
    return (
      <Layout>
        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
          <CustomCircularProgress />
        </div>
      </Layout>
    );
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
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (!searchTerm ||
        track.trackname.toLowerCase().includes(lowerCaseSearchTerm) ||
        track.artistname.toLowerCase().includes(lowerCaseSearchTerm)) &&
      (!searchBPM || track.tempo === searchBPM) &&
      (searchKey === null || track.key === searchKey)
    );
  })
  
  
    .sort((a, b) => {
      if (!bpmOrder) return 0;
      return bpmOrder === "ASC"
        ? (a.tempo ?? 0) - (b.tempo ?? 0)
        : (b.tempo ?? 0) - (a.tempo ?? 0);
    });

  const handleSpotifyAuth = () => {
    window.location.href = "/api/auth/authorizeSpotify";
  };

  return (
    <Layout
      centeredTopContent={true}
      title="Mixtape - Diskogs +"
      description="Tu Mixtape personal"
    >
     <div className="tw-container tw-mx-auto tw-p-6">
      <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Mixtape</h1>
      <div className="tw-flex tw-gap-4 tw-mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre"
          className="tw-border tw-rounded tw-p-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          value={searchKey ?? ""}
          onChange={(e) =>
            setSearchKey(e.target.value ? Number(e.target.value) : null)
          }
          className="tw-border tw-rounded tw-p-2"
        >
            <option value="">Escala crómatica - Camelot</option>
            {Array.from({ length: 12 }).map((_, key) =>
              [1, 2].map((modeNumber) => {
                const { notation, color } = getKeyNotation(key, modeNumber);
                return (
                  <option
                    value={key}
                    key={`${key}-${modeNumber}`}
                    style={{ color: color }} // convertir clase de fondo a clase de texto
                  >
                    {notation}
                  </option>
                );
              })
            )}
          </select>
          <button onClick={toggleBpmOrder}>
          {bpmOrder === "ASC" ? "⬆️" : "⬇️"} 
        </button>
        </div>

        <div className="tw-border tw-border-gray-200 tw-mt-10">
          {/* Cabecera */}

          {/* Cuerpo */}
          {filteredAndSortedMixtape.length === 0 ? (
            <div className="tw-p-2">No hay datos disponibles</div>
          ) : (
            filteredAndSortedMixtape.map((data) => (
              <MixtapeRow key={data.id} data={data} onDelete={handleDelete} />
            ))
          )}
        </div>
        <div className="tw-flex tw-justify-center">
          <button
            className="tw-mt-4 tw-bg-green-600 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-cursor-pointer"
            onClick={handleSpotifyAuth}
          >
            Iniciar sesión en Spotify para generar tu mixtape
          </button>
        </div>
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

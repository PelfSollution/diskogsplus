import { useState, useEffect, memo } from "react";
import Layout from "@/components/Layout";
import getMixtape from "../services/supabase/getMixtape";
import useGetUserData from "@/hooks/useGetUserData";
import deleteFromMixtape from "../services/supabase/deleteFromMixtape";
import MixtapeRow from "@/components/MixtapeRow";
import { Snackbar, FormControl, InputLabel, MenuItem, TextField, Select} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import CustomCircularProgress from "@/components/CustomCircularProgress";
import { getKeyNotation } from "../lib/musicnotation";

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
      return bpmOrder === "DESC"
        ? (a.tempo ?? 0) - (b.tempo ?? 0)
        : (b.tempo ?? 0) - (a.tempo ?? 0);
    });

  const handleSpotifyAuth = () => {
    window.location.href = "/api/auth/authorizeSpotify";
  };

  function getKeyNotation(key: number, modeNumber: number) {
 
    const pitchClasses = [
      "C",
      "C♯/D♭",
      "D",
      "D♯/E♭",
      "E",
      "F",
      "F♯/G♭",
      "G",
      "G♯/A♭",
      "A",
      "A♯/B♭",
      "B",
    ];

    const mode = modeNumber === 1 ? "major" : "minor";

    const camelotCodes: { [key: string]: string } = {
      "C major": "8B",
      "A minor": "8A",
      "G major": "9B",
      "E minor": "9A",
      "D major": "10B",
      "B minor": "10A",
      "A major": "11B",
      "F♯/G♭ minor": "11A",
      "E major": "12B",
      "C♯/D♭ minor": "12A",
      "B major": "1B",
      "G♯/A♭ minor": "1A",
      "F♯/G♭ major": "2B",
      "D♯/E♭ minor": "2A",
      "C♯/D♭ major": "3B",
      "A♯/B♭ minor": "3A",
      "F major": "4B",
      "D minor": "4A",
      "B♭ major": "5B",
      "G minor": "5A",
      "A♭ major": "6B",
      "F minor": "6A",
      "E♭ major": "7B",
      "C minor": "7A",
    };

    const pitchClassColors: { [key: string]: string } = {
      "1A": "tw-bg-yellow-200",
      "1B": "tw-bg-yellow-200",
      "2A": "tw-bg-yellow-300",
      "2B": "tw-bg-orange-200",
      "3A": "tw-bg-orange-200",
      "3B": "tw-bg-orange-200",
      "4A": "tw-bg-orange-300",
      "4B": "tw-bg-orange-300",
      "5A": "tw-bg-red-200",
      "5B": "tw-bg-red-200",
      "6A": "tw-bg-rose-200",
      "6B": "tw-bg-rose-200",
      "7A": "tw-bg-pink-200",
      "7B": "tw-bg-pink-200",
      "8A": "tw-bg-purple-200",
      "8B": "tw-bg-purple-200",
      "9A": "tw-bg-blue-200",
      "9B": "tw-bg-blue-200",
      "10A": "tw-bg-cyan-200",
      "10B": "tw-bg-cyan-200",
      "11A": "tw-bg-green-200",
      "11B": "tw-bg-green-200",
      "12A": "tw-bg-green-300",
      "12B": "tw-bg-green-300",
    };

    const notation = pitchClasses[key] || "N/A";

    // Agregamos un log aquí para ver qué se está produciendo para cada pista
   // console.log(`Intentando encontrar: ${notation} ${mode} en 'camelotCodes'`);

    if (!camelotCodes[`${notation} ${mode}`]) {
     /* console.log(
        `La combinación ${notation} ${mode} no se encuentra en 'camelotCodes'`
      );*/
      return {
        notation: `${notation} (N/A)`,
        color: "tw-bg-gray-400",
      };
    }

    const camelotCode = camelotCodes[`${notation} ${mode}`];
    //console.log(`Camelot code encontrado: ${camelotCode}`);

    return {
      notation: `${notation} (${camelotCode})`,
      color: pitchClassColors[camelotCode] || "tw-bg-gray-400",
    };
  }

  return (
    <Layout centeredTopContent={true} title="Mixtape - Diskogs +" description="Tu Mixtape personal">
  <div className="tw-container tw-mx-auto tw-p-6">
    <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Mixtape</h1>
    <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4">
      <FormControl variant="outlined" size="small">
        <InputLabel>Filtrar por:</InputLabel>
        <Select
          value={searchKey ?? ""}
          onChange={(e) => setSearchKey(e.target.value ? Number(e.target.value) : null)}
          label="Filtrar por:"
          className="tw-min-w-[110%] tw-mr-20 sm:tw-mr-20"
        >
          <MenuItem value="">
            <em>Escala crómatica - Camelot</em>
          </MenuItem>
          {Array.from({ length: 12 }).map((_, key) =>
            [1, 2].map((modeNumber) => {
              const { notation } = getKeyNotation(key, modeNumber);
              return (
                <MenuItem value={key} key={`${key}-${modeNumber}`}>
                  {notation}
                </MenuItem>
              );
            })
          )}
        </Select>
      </FormControl>

      <TextField
        placeholder="Buscar por nombre"
        variant="outlined"
        value={searchTerm}
        fullWidth
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
        className="tw-min-w-[60%] tw-ml-4"
      />

      <IconButton onClick={toggleBpmOrder} className="tw-min-w-[2%] tw-ml-4">
        {bpmOrder === "ASC" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
      </IconButton>
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

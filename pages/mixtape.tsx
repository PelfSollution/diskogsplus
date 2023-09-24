import { useState, useEffect, memo } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import getMixtape from "../services/supabase/getMixtape";
import useGetUserData from "@/hooks/useGetUserData";
import deleteFromMixtape from "../services/supabase/deleteFromMixtape";
import { getMixtapeURLs } from "../services/supabase/getMixtapeURLs";
import MixtapeRow from "@/components/MixtapeRow";
import {
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Select,
  Typography,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CustomSnackbar from "@/components/CustomSnackbar";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CustomCircularProgress from "@/components/CustomCircularProgress";

type Mixtape = {
  id: number;
  username: string;
  artista: string;
  trackname: string;
  disco_id: string;
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

  const { data: userData } = useGetUserData();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBPM, setSearchBPM] = useState<number | null>(null);
  const [searchKey, setSearchKey] = useState<number | null>(null);
  const [bpmOrder, setBpmOrder] = useState<"ASC" | "DESC" | null>(null);
  const [loadedMixtapeUrls, setLoadedMixtapeUrls] = useState<string[]>([]);
  const [loadingMixtapes, setLoadingMixtapes] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  const router = useRouter();

  useEffect(() => {
    async function loadMixtapes() {
      setLoadingMixtapes(true);
      try {
        const urls = await getMixtapeURLs(userData?.userProfile?.username);
        setLoadedMixtapeUrls(
          urls.map((u: { mixtape_url: string }) => u.mixtape_url)
        );
      } catch (error) {
        console.error("Error al cargar mixtapes:", error);
      } finally {
        setLoadingMixtapes(false);
      }
    }

    if (userData?.userProfile?.username) {
      loadMixtapes();
    }
  }, [userData]);

  const handleOpenSnackbar = (message: string) => {
    setSnackbar({ isOpen: true, message });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  async function handleDelete(track: Mixtape) {
    try {
      await deleteFromMixtape(
        track.username,
        track.artista,
        track.trackname,
        track.disco_id
      );
      setMixtape((prevMixtape) =>
        prevMixtape.filter((item) => item.id !== track.id)
      );

      handleOpenSnackbar(
        `Canción "${track.trackname}" de "${track.artista}" eliminada de la mixtape con éxito.`
      );
    } catch (error) {
      console.error("Error eliminando el tema:", error);
      handleOpenSnackbar(
        `Hubo un error al eliminar la canción "${track.trackname}" de "${track.artista}". Por favor, intenta nuevamente.`
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

  if (mixtape.length === 0) {
    return (
      <Layout>
        <div className="tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-4 tw-col-span-full">
          <Typography variant="body2" color="textSecondary">
            Aún no has creado ninguna mixtape. Comienza seleccionando algunas
            canciones para tu mixtape.
          </Typography>
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
          track.artista.toLowerCase().includes(lowerCaseSearchTerm)) &&
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

  const handleGenerateMixtape = async () => {
    try {
      setLoading(true);
      const username = userData?.userProfile?.username;

      // Redirige al usuario para autorizar con Spotify
      window.location.href = `/api/auth/authorizeSpotify?username=${username}`;

      // Una vez que el usuario autorice y se genere la mixtape, la lógica del callback se encargará del resto.

      // No necesitamos llamar a setLoading(false) aquí porque estamos redirigiendo.
      // Si hay algún error en el callback, puedes manejarlo allí o después de redirigir al usuario de regreso a tu aplicación.
    } catch (error) {
      setError("Error al iniciar la generación de la mixtape:" + error);
      setLoading(false);
    }
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

    if (!camelotCodes[`${notation} ${mode}`]) {
      return {
        notation: `${notation} (N/A)`,
        color: "tw-bg-gray-400",
      };
    }

    const camelotCode = camelotCodes[`${notation} ${mode}`];

    return {
      notation: `${notation} (${camelotCode})`,
      color: pitchClassColors[camelotCode] || "tw-bg-gray-400",
    };
  }

  return (
    <Layout
      centeredTopContent={true}
      title="Mixtape - Diskogs +"
      description="Tu Mixtape personal"
    >
      <div className="tw-container tw-mx-auto tw-p-6">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Mixtape</h1>
        <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4">
          <FormControl variant="outlined" size="small">
            <InputLabel>Filtrar por:</InputLabel>
            <Select
              value={searchKey ?? ""}
              onChange={(e) =>
                setSearchKey(e.target.value ? Number(e.target.value) : null)
              }
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

          <IconButton
            onClick={toggleBpmOrder}
            className="tw-min-w-[2%] tw-ml-4"
          >
            {bpmOrder === "ASC" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
          </IconButton>
        </div>

        <div className="tw-border tw-border-gray-200 tw-mt-2">
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
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center md:tw-flex-row md:tw-space-x-4">
          {/* Botón */}
          <button
            className="tw-mt-4 tw-mb-4 tw-bg-green-600 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-cursor-pointer tw-max-w-[400px]"
            onClick={handleGenerateMixtape}
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : "Iniciar sesión en Spotify para generar tu mixtape"}
          </button>

          {/* Selector (solo se muestra si hay loadedMixtapeUrls) */}
          {loadedMixtapeUrls.length > 0 && (
            <FormControl
              variant="outlined"
              size="small"
              className="tw-mt-4 md:tw-mt-0"
            >
              <InputLabel id="mixtape-label">Selecciona una mixtape</InputLabel>
              <Select
                labelId="mixtape-label"
                onChange={(e) => {
                  const embedUrl = e.target.value as string;
                  if (!embedUrl) return;
                  const newPath = `/mixtapeplayer?embedUrl=${encodeURIComponent(
                    embedUrl
                  )}`;
                  router.push(newPath);
                }}
                label="Selecciona una mixtape"
                className="tw-min-w-[400px]"
              >
                <MenuItem value="">
                  <em>Selecciona una mixtape...</em>
                </MenuItem>
                {loadedMixtapeUrls.map((url: string, index: number) => (
                  <MenuItem key={index} value={url}>
                    {`Mixtape ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </div>
      </div>

      <CustomSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        onClose={handleCloseSnackbar}
      />
    </Layout>
  );
}

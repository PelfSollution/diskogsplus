import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  Grid,
  Typography,
  Chip,
  Stack,
  Card,
  CardMedia,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import useGetAlbumInfo, { AlbumInfoInterface } from "@/hooks/useGetAlbumInfo";
import addMixtape from "../../services/supabase/addMixtape";
import deleteFromMixtape from "../../services/supabase/deleteFromMixtape";
import useGetMixtape from "../../hooks/useGetMixtape";

function AlbumDetails() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tracksInMixtape, setTracksInMixtape] = useState<string[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');

const handleOpenSnackbar = (message: string) => {
  setSnackbarMessage(message);
  setOpenSnackbar(true);
};

const handleCloseSnackbar = () => {
  setOpenSnackbar(false);
};

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const router = useRouter();

  const { id: rawId, masterId } = router.query;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data, isLoading, error } = useGetAlbumInfo(
    Number(id),
    Number(masterId)
  );
  const albumInfo: AlbumInfoInterface | null = data;

  const mixtape = useGetMixtape("dayats");

  useEffect(() => {
    if (mixtape.data) {
      setTracksInMixtape(mixtape.data.map((song) => song.trackname));
    }
  }, [mixtape.data]);

  const isSongInMixtape = (songTitle: string) => {
    console.log("Verificando tracksInMixtape:", tracksInMixtape);
    const match = tracksInMixtape.includes(songTitle);
    if (match) {
      console.log("¡Coincidencia encontrada para:", songTitle);
    }
    return match;
  };

  if (isLoading) {
    return (
      <Layout>
        <CircularProgress />
      </Layout>
    );
  }

  if (error || !albumInfo) {
    return (
      <Layout>
        Error cargando datos. Por favor intenta de nuevo más tarde.
      </Layout>
    );
  }

  const handleDeleteFromMixtape = async (track: { title: string }) => {
    if (!albumInfo || !id) return;
    // Comprobar si el id es undefined
    if (typeof id === "undefined") {
      console.error("No se proporcionó un ID válido.");
      return;
    }

    try {
      await deleteFromMixtape("dayats", albumInfo.artist, track.title, id);
      setTracksInMixtape((prevTracks) =>
        prevTracks.filter((t) => t !== track.title)
      );
      handleOpenSnackbar("Canción eliminada de la mixtape con éxito.");
    } catch (error) {
      console.error("Error al eliminar de la mixtape:", error);
      handleOpenSnackbar("Error al eliminar la canción de la mixtape.");
    }
  };

  const handleAddToMixtape = (track: {
    title: string;
    spotifyTrackId?: string;
  }) => {
    if (!albumInfo || !id) return;

    // Comprobar si el id es undefined
    if (typeof id === "undefined") {
      console.error("No se proporcionó un ID válido.");
      return;
    }

    // Extraer la información relevante de albumInfo y track
    const mixtapeEntry = {
      //test hardcoded username
      username: "dayats",
      artistname: albumInfo.artist,
      trackname: track.title, // Aquí es donde usamos el nombre de la canción
      discogsalbumid: id,
      spotifytrackid: track.spotifyTrackId || null,
    };

    // Llamar a la función addMixtape para añadir a la base de datos
    addMixtape(mixtapeEntry);
    setTracksInMixtape((prevTracks) => [...prevTracks, track.title]);
    handleOpenSnackbar("Canción añadida a la mixtape con éxito.");
  };

  return (
    <Layout centeredContent={false}>
      <Grid container spacing={3} className="tw-container tw-mx-auto tw-p-6">
        {/* Columna de la izquierda */}
        <Grid item xs={12} md={7}>
          {/* Contenedor flex para centrar verticalmente y horizontalmente */}
          <div className="tw-flex tw-items-center tw-mb-4 tw-mt-4">
            {/* Componente de la portada del disco */}
            <div
              className="relative cursor-pointer tw-w-64 tw-h-64"
              onClick={handleFlip}
            >
              <Card
                className={`absolute w-full h-full transform transition-transform duration-700 
               ${isFlipped ? "rotate-180" : "rotate-0"}`}
              >
                <CardMedia
                  component="img"
                  image={
                    isFlipped ? albumInfo.backCoverImage : albumInfo.coverImage
                  }
                  alt={`${albumInfo.artist} - ${albumInfo.title} ${
                    isFlipped ? "back cover" : "front cover"
                  }`}
                />
              </Card>
            </div>

            {/* Información del artista y álbum */}
            <div className="tw-ml-4">
              <Typography variant="h5">{albumInfo.artist}</Typography>
              <Typography variant="h6">{albumInfo.title}</Typography>
            </div>
          </div>
          <Typography variant="subtitle1">
            Released in {albumInfo.released}
          </Typography>
          <Typography variant="subtitle2">
            Added to collection: July 30, 2019
            {/* Nota: Puedes reemplazar la fecha estática con la que desees */}
          </Typography>

          <Typography variant="h6" gutterBottom>
            Labels
          </Typography>
          <Chip label={albumInfo.label} className="tw-mr-2" />

          {(albumInfo.genres?.length || albumInfo.lastfmTags?.length) && (
            <>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Stack direction="row" flexWrap="wrap">
                {albumInfo.genres &&
                  albumInfo.genres.map((genre: string) => (
                    <Chip
                      key={genre}
                      label={genre}
                      className="tw-mr-2 tw-mb-2"
                    />
                  ))}

                {albumInfo.lastfmTags &&
                  albumInfo.lastfmTags.map((tag: string) => (
                    <Chip key={tag} label={tag} className="tw-mr-2 tw-mb-2" />
                  ))}
              </Stack>
            </>
          )}

          {albumInfo.enrichedInfo && (
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon className="tw-text-blue-500 tw-text-xl" />
                }
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="h6">Información extra</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1">
                  {albumInfo.enrichedInfo}
                </Typography>
              </AccordionDetails>
            </Accordion>
          )}

          {albumInfo.tracklist && albumInfo.tracklist.length > 0 && (
            <Accordion>
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon className="tw-text-blue-500 tw-text-xl" />
                }
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="h6">Tracklist</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="column" spacing={1}>
                  {albumInfo.tracklist.map((track, index) => (
                    <div
                      key={index}
                      className="tw-flex tw-justify-between tw-items-center tw-mb-2"
                    >
                      <span>{track.title}</span>
                      {isSongInMixtape(track.title) ? (
                        <button onClick={() => handleDeleteFromMixtape(track)}>
                          Borrar de Mixtape
                        </button>
                      ) : (
                        <button onClick={() => handleAddToMixtape(track)}>
                          Añadir a Mixtape
                        </button>
                      )}
                    </div>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}
        </Grid>

        {/* Columna de la derecha */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" gutterBottom>
            Escucha ahora
          </Typography>

          {albumInfo.spotifyAlbumId ? (
            <iframe
              src={`https://open.spotify.com/embed/album/${albumInfo.spotifyAlbumId}`}
              width="100%"
              height="380"
              frameBorder="0"
              allow="encrypted-media"
            ></iframe>
          ) : (
            <Typography variant="body1" color="textSecondary">
              Este álbum no está disponible en Spotify.
            </Typography>
          )}

          {/* ... Resto de tu componente ... */}
        </Grid>
      </Grid>
      <Snackbar
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  open={openSnackbar}
  autoHideDuration={3000} // Duración en milisegundos
  onClose={handleCloseSnackbar}
  message={snackbarMessage}
  action={
    <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
      <CloseIcon />
    </IconButton>
  }
/>
    </Layout>
  );
}

export default AlbumDetails;

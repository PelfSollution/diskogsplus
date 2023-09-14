import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  Grid,
  Button,
  Typography,
  Chip,
  Stack,
  Card,
  CardMedia,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  List, ListItem,ListItemText
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import useGetAlbumInfo, { AlbumInfoInterface } from "@/hooks/useGetAlbumInfo";
import addMixtape from "../../services/supabase/addMixtape";
import deleteFromMixtape from "../../services/supabase/deleteFromMixtape";
import useGetMixtape from "../../hooks/useGetMixtape";
import useGetUserData from "@/hooks/useGetUserData";
import CustomCircularProgress from "@/components/CustomCircularProgress";


interface TrackInfo {
  position: string;
  title: string;
  duration: string;
  spotifyTrackId?: string;
  spotifyUri?: string;
  tempo?: number;
  key?: number;
  mode?: number;
}

type TrackType = {
  title: string;
  spotifyTrackId?: string;
  tempo?: number;
  key?: number;
  mode?: number;
  duration?: string;
};

function AlbumDetails() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tracksInMixtape, setTracksInMixtape] = useState<string[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { data: userData } = useGetUserData();
  const [inWantlist, setInWantlist] = useState(false);
  const [loading, setLoading] = useState(false);


  

  const handleAddToWantlist = async (username: string, albumId: number) => {
    setLoading(true);

    try {
      const response = await fetch("/api/albums/addToWantlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          releaseId: albumId,
          // Puedes agregar notas y rating si los tienes
          // notes: "TuNotaAqui",
          // rating: TuValorDeRatingAqui
        }),
      });

      const data = await response.json();

      if (data.success) {
        handleOpenSnackbar(`Álbum añadido a la wantlist!`);
        setInWantlist(true);
      } else {
        alert("Error al añadir el álbum: " + data.message);
      }
    } catch (error) {
      console.error("Hubo un error al hacer la solicitud:", error);
      alert("Error al añadir el álbum a la wantlist.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWantlist = async (
    username: string,
    albumId: number
  ) => {
    setLoading(true);

    try {
      const response = await fetch("/api/albums/removeFromWantlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          releaseId: albumId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        handleOpenSnackbar(`Álbum eliminado de la wantlist!`);
        setInWantlist(false);
      } else {
        alert("Error al eliminar el álbum: " + data.message);
      }
    } catch (error) {
      console.error("Hubo un error al hacer la solicitud:", error);
      alert("Error al eliminar el álbum de la wantlist.");
    } finally {
      setLoading(false);
    }
  };

  const username = userData?.userProfile?.username;

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

  const fromCompare = router.query.from === "compare";

  const { id: rawId, masterId } = router.query;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const idNumber = parseInt(id || "0", 10); // Aquí se crea idNumber

  const { data, isLoading, error } = useGetAlbumInfo(
    idNumber,
    Number(masterId)
  );

  const albumInfo: AlbumInfoInterface | null = data;

  

  const redirectToChat = () => {
    if (albumInfo && username) {
      const query = `?artista=${encodeURIComponent(albumInfo.artist)}&album=${encodeURIComponent(albumInfo.title)}&username=${encodeURIComponent(username)}`;
      router.push(`/chat${query}`);
    }
  }
  
  

  useEffect(() => {
    if (albumInfo && albumInfo.isPopularAlbum) {
      handleOpenSnackbar(
        `El disco de ${albumInfo.artist} que tienes en vinilo, no se encontró en Spotify.`
      );
    }
  }, [albumInfo]);
  

  const mixtape = useGetMixtape(username);

  
  

  useEffect(() => {
    if (mixtape.data) {
      setTracksInMixtape(mixtape.data.map((song) => song.trackname));
    }
  }, [mixtape.data]);

  const isSongInMixtape = (songTitle: string) => {
    //  console.log("Verificando tracksInMixtape:", tracksInMixtape);
    const match = tracksInMixtape.includes(songTitle);
    if (match) {
      // console.log("¡Coincidencia encontrada para:", songTitle);
    }
    return match;
  };

  if (isLoading) {
    return (
      <Layout centeredContent={true}>
        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
          <CustomCircularProgress />
        </div>
      </Layout>
    );
  }

  if (error || !albumInfo) {
    return (
      <Layout centeredContent={true}>
        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
          Error cargando datos. Por favor intenta de nuevo más tarde.
        </div>
      </Layout>
    );
  }

  const handleDeleteFromMixtape = async (track: { title: string }) => {
    if (!albumInfo || !id || !userData) return;
    // Comprobar si el id es undefined
    if (typeof id === "undefined") {
      console.error("No se proporcionó un ID válido.");
      return;
    }

    const username = userData.userProfile.username;

    try {
      await deleteFromMixtape(username, albumInfo.artist, track.title, id);
      setTracksInMixtape((prevTracks) =>
        prevTracks.filter((t) => t !== track.title)
      );
      const trackname = track.title;
      const artistname = albumInfo.artist;

      handleOpenSnackbar(
        `Canción "${trackname}" de "${artistname}" eliminada de la mixtape con éxito.`
      );
    } catch (error) {
      console.error("Error al eliminar de la mixtape:", error);
      handleOpenSnackbar("Error al eliminar la canción de la mixtape.");
    }
  };

  const handleAddToMixtape = (track: TrackType) => {
    if (!albumInfo || !id || !userData) return;

    // Comprobar si el id es undefined
    if (typeof id === "undefined") {
      console.error("No se proporcionó un ID válido.");
      return;
    }

    const username = userData.userProfile.username;
    // Extraer la información relevante de albumInfo y track
    const mixtapeEntry = {
      username: username,
      artistname: albumInfo.artist,
      trackname: track.title, // Aquí es donde usamos el nombre de la canción
      discogsalbumid: id,
      spotifytrackid: track.spotifyTrackId || null,
      tempo: track.tempo || null,
      key: track.key || null,
      mode: track.mode || null,
      duration: track.duration || null,
    };

    // Llamar a la función addMixtape para añadir a la base de datos
    addMixtape(mixtapeEntry);
    setTracksInMixtape((prevTracks) => [...prevTracks, track.title]);
    const trackname = track.title;
    const artistname = albumInfo.artist;
    handleOpenSnackbar(
      `Canción "${trackname}" de "${artistname}" añadida a la mixtape con éxito.`
    );
  };

  const isValidNumber = (value: any): value is number =>
    typeof value === "number" && !isNaN(value);

    const getImageComponent = (imageURL: string | undefined, altText: string) => {
      const defaultImage = "/no-portada.gif"; 
    
      if (imageURL && imageURL !== "") {
        return <CardMedia component="img" image={imageURL} alt={altText} />;
      } else {
        return <CardMedia component="img" image={defaultImage} alt="Imagen no disponible" />;
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
    <Layout centeredTopContent={true}>
      <Grid container spacing={3} className="tw-container tw-mx-auto tw-p-6">
        {/* Columna de la izquierda */}
        <Grid item xs={12} md={7}>
          {/* Contenedor flex para centrar verticalmente y horizontalmente */}
          <div className="tw-flex tw-items-center tw-mb-4 tw-mt-4">
            {/* Componente de la portada del disco */}
            <div
              className="relative cursor-pointer tw-w-32 tw-h-32 md:tw-w-64 md:tw-h-64"
              onClick={handleFlip}
            >
              <Card
                className={`absolute w-full h-full transform transition-transform duration-700 
        ${isFlipped ? "rotate-180" : "rotate-0"}`}
              >
                {isFlipped
                  ? getImageComponent(
                      albumInfo.backCoverImage,
                      `${albumInfo.artist} - ${albumInfo.title} back cover`
                    )
                  : getImageComponent(
                      albumInfo.coverImage,
                      `${albumInfo.artist} - ${albumInfo.title} front cover`
                    )}
              </Card>
            </div>

            {/* Información del artista y álbum */}
            <div className="tw-ml-4">
              <Typography variant="h5">{albumInfo.artist}</Typography>
              <Typography variant="h6">{albumInfo.title}</Typography>
            </div>
  
          </div>
          {/* Botón para preguntar sobre el disco */}
  <div>
  <Button onClick={redirectToChat} variant="outlined"  style={{ width: "250px", marginBottom: "5px"  }}>
  🤖 Ask to Discobot 
  </Button>
  </div>
          {fromCompare && (
            <>
              {inWantlist ? (
                <Button
                  style={{ width: "250px", marginBottom: "5px"  }}
                  color="error"
                  variant="outlined"
                  onClick={() => handleRemoveFromWantlist(username, idNumber)}
                >
                  {loading ? "Eliminando..." : "Quitar de la wishlist"}
                </Button>
              ) : (
                <Button
                  style={{ width: "250px", marginBottom: "5px"  }}
                  color="success"
                  variant="outlined"
                  className="tw-w-48"
                  onClick={() => handleAddToWantlist(username, idNumber)}
                >
                  {loading ? "Añadiendo..." : "Añadir a wishlist"}
                </Button>
              )}
            </>
          )}

          <Typography variant="subtitle1">
            Released in {albumInfo.released}
          </Typography>
          <Typography variant="subtitle2">
            {/*Added to collection: July 30, 2019*/}
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
                  {albumInfo.tracklist.map(
                    (track: TrackInfo, index: number) => (
                      <div
                        key={index}
                        className="tw-flex tw-justify-between tw-items-center tw-mb-2"
                      >
                        <div className="tw-min-w-[200px] tw-max-w-[500px]">
                          {track.title} - {track.duration}
                          <div className="tw-flex tw-item-center tw-gap-1 tw-items-start tw-max-w-[100]">
                            {track.tempo && (
                              <div className="tw-text-xs tw-bg-gray-200 tw-rounded-full tw-px-2 tw-py-1">
                                {track.tempo.toFixed(1)}
                              </div>
                            )}

                            {typeof track.key === "number" &&
                            track.key !== null &&
                            typeof track.mode === "number" &&
                            track.mode !== null ? (
                              <div
                                className={`tw-text-xs tw-text-white tw-px-2 tw-py-1 tw-rounded-full ${
                                  getKeyNotation(track.key, track.mode).color
                                }`}
                              >
                                {getKeyNotation(track.key, track.mode).notation}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div>
                          {isSongInMixtape(track.title) ? (
                            <button
                              className="tw-opacity-100 hover:tw-opacity-70 tw-text-red-400 tw-border tw-border-red-400 md:tw-px-2 md:tw-py-1 tw-px-1 tw-py-0.5 tw-rounded tw-min-w-[100px]"
                              onClick={() => handleDeleteFromMixtape(track)}
                            >
                              Borrar de Mixtape
                            </button>
                          ) : (
                            <button
                              className="tw-opacity-100 hover:tw-opacity-70 tw-text-green-400 tw-border tw-border-green-400 md:tw-px-2 md:tw-py-1 tw-px-1 tw-py-0.5 tw-rounded tw-min-w-[100px]"
                              onClick={() => handleAddToMixtape(track)}
                            >
                              Añadir a Mixtape
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}
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
  <>
    {albumInfo.isPopularAlbum && (
      <div className="tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-4">
        <Typography variant="body2" color="textSecondary">
          El disco de {albumInfo.artist} que tienes en vinilo, no se encontró en Spotify. Mostrando uno de los discos más populares:
        </Typography>
      </div>
    )}
    <iframe
      src={`https://open.spotify.com/embed/album/${albumInfo.spotifyAlbumId}`}
      width="100%"
      height="380"
      frameBorder="0"
      allow="encrypted-media"
    ></iframe>
  </>
) : (
  <div className="tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-4">
    <Typography variant="body2" color="textSecondary">
      Este artista no está disponible en Spotify.
    </Typography>
  </div>
)}




        </Grid>
      </Grid>
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

export default AlbumDetails;

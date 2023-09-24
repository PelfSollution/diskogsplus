import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Grid,
  Button,
  Typography,
  Chip,
  Stack,
  Card,
  CardMedia,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  IconButton,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import { Link as MuiLink } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import useGetAlbumInfo, { AlbumInfoInterface } from "@/hooks/useGetAlbumInfo";
import useGetMixtape from "@/hooks/useGetMixtape";
import useGetUserData from "@/hooks/useGetUserData";
import addMixtape from "@/services/supabase/addMixtape";
import deleteFromMixtape from "@/services/supabase/deleteFromMixtape";
import { enrichArtistInfoWithChatGPT } from "@/services/openai/enrichArtistInfo";
import { getArtistImageFromSupabase } from "@/services/supabase/getArtistImageFromSupabase";
import { isAlbumInWantlist } from "@/services/supabase/checkAlbumInWantlist";
import DOMPurify from "dompurify";

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
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [backCoverImage, setBackCoverImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [enrichedInfo, setEnrichedInfo] = useState<string | null>(null);







  const handleAddToWantlist = async (
    username: string,
    disco_id: number,
    artista: string,
    album: string,
    image_url: string
  ) => {
    setLoading(true);

    try {
      const response = await fetch("/api/albums/addToWantlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          disco_id: disco_id,
          artista: artista,
          album: album,
          image_url: image_url,
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
    disco_id: number
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
          disco_id: disco_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        handleOpenSnackbar(`Álbum eliminado de la wantlist!`);
        setInWantlist(false);
      } else {
        alert("Error al eliminar el álbum: " + data.message);
      }
    } catch (error: any) {
      console.error("Hubo un error al hacer la solicitud:", error);
      alert("Error al eliminar el álbum de la wantlist: " + error.message);
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
    if (!isGenerating) {
      setIsFlipped(!isFlipped);
    }
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
      let baseQuery = `?artista=${encodeURIComponent(
        albumInfo.artist
      )}&album=${encodeURIComponent(
        albumInfo.title
      )}&username=${encodeURIComponent(username)}&disco_id=${id}`;
      const fromParam = router.query.from;
      if (fromParam === "compare") {
        baseQuery += `&from=compare`;
      }

      router.push(`/chat${baseQuery}`);
    }
  };




  useEffect(() => {
    const checkIfAlbumInWantlist = async () => {
      if (username && id) {
        const disco_id = Number(id);
        const isInWantlist = await isAlbumInWantlist(username, disco_id);
        setInWantlist(isInWantlist);
      }
    };
    checkIfAlbumInWantlist();
  }, [userData, username, id]);

  useEffect(() => {
    if (albumInfo) {
      setEnrichedInfo(albumInfo.enrichedInfo || null);
  }
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
      // console.log("¡Match encontrada para:", songTitle);
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

  function transformYouTubeUrlToEmbed(url: string): string {
    const videoCode = url.split("v=")[1];

    return `https://www.youtube.com/embed/${videoCode}`;
  }

  const prevVideo = () => {
    if (activeVideoIndex > 0) setActiveVideoIndex(activeVideoIndex - 1);
  };

  const nextVideo = () => {
    if (
      albumInfo &&
      albumInfo.videos &&
      activeVideoIndex < albumInfo.videos.length - 1
    ) {
      setActiveVideoIndex(activeVideoIndex + 1);
    }
  };

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
      artista: albumInfo.artist,
      trackname: track.title, // Aquí es donde usamos el nombre de la canción
      disco_id: id,
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

    const handleGenerateImage = async () => {
      console.log("Generando imagen para", albumInfo.artist, albumInfo.title);
      setIsGenerating(true);
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artistName: albumInfo.artist,
          coverType: isFlipped ? "back" : "front",
          title: albumInfo.title,
        }),
      });

      const data = await response.json();

      if (data.imageUrl) {
        if (isFlipped) {
          setBackCoverImage(data.imageUrl);
        } else {
          setCoverImage(data.imageUrl);
        }
        setIsGenerating(false);
        handleOpenSnackbar(`Imagen generada con éxito.`);
      } else {
        // Mostrar un error al usuario o manejarlo como lo necesites.
      }
    };

    // Si no hay imageURL, intentar obtener de Supabase.
    if (!imageURL) {
      (async () => {
        const artistImage = await getArtistImageFromSupabase(albumInfo.artist);
        if (artistImage) {
          imageURL = artistImage; // Actualizamos la URL de la imagen.
        }
      })();
    }

    if (imageURL && !imageURL.includes("generated_images")) {
      return <CardMedia component="img" image={imageURL} alt={altText} />;
    } else {
      return (
        <div className="relative h-full w-full">
          <CardMedia
            component="img"
            className="w-full h-full absolute z-0"
            image={imageURL || defaultImage}
            alt={altText}
          />
          <div className="tw-h-0">
            <Button
              aria-label={
                imageURL && imageURL.includes("generated_images")
                  ? "Imagen Generada"
                  : "Genera imagen"
              }
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateImage();
              }}
              className="tw-text-white tw-top-[-40px]"
              style={{ color: "white" }}
            >
              {isGenerating
                ? "Generando..."
                : imageURL && imageURL.includes("generated_images")
                ? "Imagen Generada"
                : "Genera Imagen"}
            </Button>
          </div>
        </div>
      );
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

  const getColor = (matchPercentage: number) => {
    if (matchPercentage >= 70) return "success"; // verde
    if (matchPercentage >= 30) return "warning"; // naranja
    return "error"; // rojo
  };

  const sanitizedHTML = DOMPurify.sanitize(albumInfo.artistBio || "");

  function truncateBio(htmlContent: string): string {
    const linkText = "Read more on Last.fm";
    const linkIndex = htmlContent.indexOf(linkText);

    let truncatedContent =
      linkIndex !== -1
        ? htmlContent.substring(0, linkIndex + linkText.length)
        : htmlContent;

    truncatedContent = truncatedContent.replace(
      '<a href="https://last.fm">',
      '<a href="https://last.fm" target="_blank" rel="noopener noreferrer">'
    );

    return truncatedContent;
  }

  const truncatedHTML = truncateBio(sanitizedHTML);
  const year = new Date(albumInfo.released).getFullYear();
  const yearReleased = isNaN(year) ? null : year; 



  const handleEnrichArtistInfo = async () => {
    console.log("Iniciando handleEnrichArtistInfo...");

    const { artist, title } = albumInfo;

    if (!artist || !title || !idNumber) {
        console.error("Información necesaria no proporcionada");
        return;
    }

    setIsGenerating(true);

    try {
        const response = await fetch("/api/albums/enrichArtistInfo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                artistName: artist,
                albumName: title,
                discoId: idNumber,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos recibidos:", data);

        if (data.enrichedInfo) {
            setEnrichedInfo(data.enrichedInfo);
        } else {
            // Puedes mostrar un mensaje de error al usuario aquí.
            console.error("Información enriquecida no recibida.");
        }
    } catch (error) {
        console.error("Error en handleEnrichArtistInfo:", error);
    } finally {
        setIsGenerating(false);
    }
};

  

  return (
    <Layout centeredTopContent={true}>
      <Grid container spacing={3} className="tw-container tw-mx-auto tw-p-6">
        {/* Columna de la izquierda */}
        <Grid item xs={12} md={7}>
          {/* Contenedor flex para centrar verticalmente y horizontalmente */}
          <div className="tw-flex tw-items-center tw-mb-4 tw-mt-4">
            {/* Componente de la portada del disco */}
            <div
              className={`relative cursor-pointer tw-w-32 tw-h-32 md:tw-w-64 md:tw-h-64 ${
                isGenerating ? "cursor-not-allowed" : ""
              }`}
              onClick={handleFlip}
            >
              <Card
                className={`absolute w-full h-full transform transition-transform duration-700 ${
                  isFlipped ? "rotate-180" : "rotate-0"
                }`}
              >
                {isFlipped
                  ? getImageComponent(
                      backCoverImage || albumInfo.backCoverImage,
                      `${albumInfo.artist} - ${albumInfo.title} back cover`
                    )
                  : getImageComponent(
                      coverImage || albumInfo.coverImage,
                      `${albumInfo.artist} - ${albumInfo.title} front cover`
                    )}
              </Card>
            </div>

            {/* Información del artista y álbum */}
            <div className="tw-ml-4">
              <Typography variant="h5">{albumInfo.artist}</Typography>
              <Typography variant="h6">{albumInfo.title}</Typography>
              <Chip label={yearReleased} />
            </div>
          </div>
          {/* Botón para preguntar sobre el disco */}
          <div>
            <Button
              onClick={redirectToChat}
              variant="outlined"
              style={{ width: "250px", marginBottom: "5px" }}
            >
              🤖 Ask to DiscBOT
            </Button>
          </div>
          {fromCompare && (
            <>
              {inWantlist ? (
                <Button
                  style={{ width: "250px", marginBottom: "5px" }}
                  color="error"
                  variant="outlined"
                  onClick={() => handleRemoveFromWantlist(username, idNumber)}
                >
                  {loading ? "Eliminando..." : "Quitar de la wishlist"}
                </Button>
              ) : (
                <Button
                  style={{ width: "250px", marginBottom: "5px" }}
                  color="success"
                  variant="outlined"
                  className="tw-w-48"
                  onClick={() =>
                    handleAddToWantlist(
                      username,
                      idNumber,
                      albumInfo.artist,
                      albumInfo.title,
                      albumInfo.coverImage
                    )
                  }
                >
                  {loading ? "Añadiendo..." : "Añadir a wishlist"}
                </Button>
              )}
            </>
          )}

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

          <Accordion className="tw-mt-4">
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon className="tw-text-blue-400 tw-text-xl" />
              }
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography variant="h6">
                Información{" "}
                <Chip
                  label="powered by [Last.fm & 🤖 DiscoBOT]"
                  className="tw-text-xs tw-font-thin tw-ml-1"
                />
              </Typography>
            </AccordionSummary>
            {albumInfo.artistBio && ( 
              <>
                <AccordionDetails>
                  <Typography
                    variant="body1"
                    className="tw-whitespace-pre-line bio-content"
                  >
                        <Chip
                  label="Last.fm"
                  className="tw-text-xs tw-font-thin tw-mb-1"
             
                />
                    <div dangerouslySetInnerHTML={{ __html: truncatedHTML }} />
                  </Typography>
                </AccordionDetails>
              </>
            )}
            <Divider className="tw-my-2" />{" "}
            {/* Opcional: Un separador entre la información y la biografía */}
            <AccordionDetails>
        <Typography variant="body1" className="tw-whitespace-pre-line">
            <Chip
                label="OpenAI ESP"
                className="tw-text-xs tw-font-thin tw-mb-2"
                //...otros props...
            />
            <div>{enrichedInfo}</div> 
        </Typography>
        {!enrichedInfo && 
            <Button 
                type="submit" 
                variant="outlined" 
                className="tw-flex tw-w-full" 
                onClick={handleEnrichArtistInfo}
                disabled={isGenerating}
            >
                {isGenerating ? "Generando texto..." : "Obtener Información Enriquecida"}
            </Button>
        }
    </AccordionDetails>
          </Accordion>

          <div className="tw-mt-1">
            <Accordion>
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon className="tw-text-blue-400 tw-text-xl" />
                }
                aria-controls="panel3a-content"
                id="panel3a-header"
              >
                <Typography variant="h6">Artistas Similares</Typography>
                <Chip
                  label="powered by Last.fm"
                  className="tw-text-xs tw-font-thin tw-ml-2 tw-mb-1"
                  color="warning"
                />
              </AccordionSummary>
              <AccordionDetails>
                <div>
                  {albumInfo?.similarArtists &&
                  albumInfo?.similarArtists.length > 0 ? (
                    <Grid container spacing={2}>
                      {albumInfo.similarArtists.map((artist) => {
                        const matchPercentage = Math.round(
                          Number(artist.match) * 100
                        );
                        return (
                          <Grid item xs={6} md={4} key={artist.mbid}>
                            <Card>
                              <CardContent
                                style={{
                                  paddingTop: "6px",
                                  paddingBottom: "10px",
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  <MuiLink
                                    href={artist.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      textDecoration: "none",
                                      color: "inherit",
                                    }}
                                    title={artist.name}
                                  >
                                    <OpenInNewIcon
                                      style={{
                                        marginRight: "4px",
                                        fontSize: "14px",
                                      }}
                                    />
                                    {artist.name}
                                  </MuiLink>
                                </Typography>

                                <Chip
                                  label={`Match: ${matchPercentage}%`}
                                  color={getColor(matchPercentage)}
                                  variant="outlined"
                                  style={{ marginTop: "4px" }}
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  ) : (
                    <div className="tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-4">
                      <Typography variant="body2" color="textSecondary">
                        Last.fm no ha podido facilitar ningún artista parecido
                        para {albumInfo?.artist}.
                      </Typography>
                    </div>
                  )}
                </div>
              </AccordionDetails>
            </Accordion>
          </div>

          {albumInfo.tracklist && albumInfo.tracklist.length > 0 && (
            <Accordion className="tw-mt-1">
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon className="tw-text-blue-400 tw-text-xl" />
                }
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="h6">Tracklist</Typography>
                <Chip
                  label="powered by Spotify"
                  className="tw-text-xs tw-font-thin tw-ml-1"
                  color="success"
                />
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
                                {track.tempo.toFixed(0)}
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
                    El disco de {albumInfo.artist} que tienes en vinilo, no se
                    encontró en Spotify. Mostrando uno de los discos más
                    populares:
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
          <div className="tw-mt-4">
            <Accordion>
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon className="tw-text-blue-400 tw-text-xl" />
                }
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography variant="h6">
                  Tracks Similares
                  <Chip
                    label="powered by Last.fm"
                    className="tw-text-xs tw-font-thin tw-ml-2 tw-mb-1"
                    color="warning"
                  />
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div>
                  {albumInfo?.similarTracks &&
                  albumInfo?.similarTracks.length > 0 ? (
                    <Grid container spacing={2}>
                      {albumInfo.similarTracks.slice(0, 6).map((track) => {
                        const matchPercentage = Math.round(track.match * 100);
                        return (
                          <Grid
                            item
                            xs={6}
                            md={4}
                            key={track.mbid || track.name}
                          >
                            <Card>
                              <CardContent
                                style={{
                                  paddingTop: "6px",
                                  paddingBottom: "10px",
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  <MuiLink
                                    href={track.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      textDecoration: "none",
                                      color: "inherit",
                                    }}
                                    title={track.name}
                                  >
                                    <OpenInNewIcon
                                      style={{
                                        marginRight: "4px",
                                        fontSize: "14px",
                                      }}
                                    />
                                    {track.name}
                                  </MuiLink>
                                </Typography>

                                <Typography
                                  variant="subtitle2"
                                  style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {track.artist.name}
                                </Typography>

                                <Chip
                                  label={`Match: ${matchPercentage}%`}
                                  color={getColor(matchPercentage)}
                                  variant="outlined"
                                  style={{ marginTop: "4px" }}
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  ) : (
                    <div className="tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-4">
                      <Typography variant="body2" color="textSecondary">
                        Last.fm no ha podido facilitar ningún track parecido
                        para {albumInfo?.artist}.
                      </Typography>
                    </div>
                  )}
                </div>
              </AccordionDetails>
            </Accordion>
          </div>

          <div className="tw-mt-1">
            <Accordion>
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon className="tw-text-blue-400 tw-text-xl" />
                }
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="h6">Vídeos</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {albumInfo.videos && albumInfo.videos.length > 0 ? (
                  <>
                    <iframe
                      width="100%"
                      src={transformYouTubeUrlToEmbed(
                        albumInfo.videos[activeVideoIndex].uri
                      )}
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>

                    <div className="tw-flex tw-justify-center tw-mt-4">
                      {albumInfo.videos.map((_, index) => (
                        <span
                          key={index}
                          onClick={() => setActiveVideoIndex(index)}
                          className={`tw-mx-1 tw-block tw-w-2 tw-h-2 tw-rounded-full ${
                            activeVideoIndex === index
                              ? "tw-bg-blue-400"
                              : "tw-bg-gray-300"
                          } tw-cursor-pointer`}
                        ></span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-4 tw-w-full">
                    <Typography variant="body2" color="textSecondary">
                      Discogs no ha podido facilitar ningún vídeo del grupo{" "}
                      {albumInfo?.artist}.
                    </Typography>
                  </div>
                )}
              </AccordionDetails>
            </Accordion>
          </div>
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

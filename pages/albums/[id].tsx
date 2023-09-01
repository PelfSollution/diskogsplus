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
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useGetAlbumInfo, { AlbumInfoInterface } from "@/hooks/useGetAlbumInfo";
import addMixtape from '../../services/supabase/addMixtape';


function AlbumDetails() {
  const [isFlipped, setIsFlipped] = useState(false);

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

  const handleAddToMixtape = () => {
    if (!albumInfo || !id) return;

    // Extraer la información relevante de albumInfo
    const mixtapeEntry = {
      username: "dayats",
      artistname: albumInfo.artist,
      trackname: albumInfo.title,
      discogsalbumid: id,
      spotifytrackid: albumInfo.tracklist[0]?.spotifyTrackId || null 
    };

    // Llamar a la función addMixtape para añadir a la base de datos
    addMixtape(mixtapeEntry);
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
          expandIcon={<ExpandMoreIcon className="tw-text-blue-500 tw-text-xl" />}
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
      expandIcon={<ExpandMoreIcon className="tw-text-blue-500 tw-text-xl" />}
      aria-controls="panel1a-content"
      id="panel1a-header"
    >
      <Typography variant="h6">Tracklist</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Stack direction="column" spacing={1}>
        {albumInfo.tracklist.map((track, index) => (
          <div key={index} className="tw-flex tw-justify-between tw-items-center tw-mb-2">
            <span>{track.title}</span>
          <button 
            className="tw-px-2 tw-py-1 tw-border tw-border-gray-400 tw-rounded" 
            onClick={handleAddToMixtape}
          >
              Añadir a mixtape
            </button>
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
    </Layout>
  );
}

export default AlbumDetails;

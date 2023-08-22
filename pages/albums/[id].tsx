import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  Grid,
  Typography,
  Chip,
  Stack,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import Link from 'next/link';
import useGetAlbumInfo, { AlbumInfoInterface } from "@/hooks/useGetAlbumInfo";


function AlbumDetails() {
  const router = useRouter();
  const { id, masterId } = router.query;
  const { data, isLoading, error } = useGetAlbumInfo(Number(id), Number(masterId));
  const albumInfo: AlbumInfoInterface = data;

  console.log("Error:", error);

  if (isLoading) {
    return <Layout>Cargando...</Layout>;
  }

  if (error || !albumInfo) {
    
    return <Layout>Error cargando datos. Por favor intenta de nuevo más tarde.</Layout>;
   
  }
  console.log("Data received:", data);
console.log("Album info:", albumInfo);
console.log("Album info released:", albumInfo.released);

  return (
    <Layout centeredContent={false}>
    <Grid container spacing={3} className="tw-container tw-mx-auto tw-p-6">
      {/* Columna de la izquierda */}
      <Grid item xs={12} md={7}>
        <Typography variant="subtitle1">Released in {albumInfo.released}</Typography>
        <Typography variant="subtitle2">
          Added to collection: July 30, 2019
          {/* Nota: Puedes reemplazar la fecha estática con la que desees */}
        </Typography>

        <Typography variant="h6" gutterBottom>
          Labels
        </Typography>
        <Chip label={albumInfo.label} className="tw-mr-2"/>

        <Typography variant="h6" gutterBottom>
          Genres
        </Typography>
        <Stack direction="row" spacing={1}>
        {albumInfo.genres && albumInfo.genres.map((genre: string) => (
    <Chip key={genre} clickable label={genre} color="primary"/>
))}

{albumInfo.lastfmTags && albumInfo.lastfmTags.map((tag: string) => (
    <Chip key={tag} clickable label={tag} color="secondary"/>
))}
</Stack>

        <Accordion defaultExpanded>
          <AccordionSummary>
            <Typography variant="h6">Album Notes</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1">
              {/* Aquí puedes incluir detalles o notas adicionales sobre el álbum */}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Grid>

      {/* Columna de la derecha */}
      <Grid item xs={12} md={5}>
        <Typography variant="h6" gutterBottom>
          Listen Now
        </Typography>
        <iframe
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          frameBorder="0" // Cambiado a frameBorder con 'B' en mayúscula.
          height="450"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          src="https://embed.music.apple.com/us/album/1422648512?theme=light"
          style={{
            width: "100%",
            overflow: "hidden",
            background: "transparent",
            borderRadius: "15px",
          }}
        ></iframe>

        {/* Agrega los otros componentes como videos de YouTube, imágenes, etc. */}
      </Grid>
    </Grid>
  </Layout>
  );
}

export default AlbumDetails;

import { useRouter } from 'next/router';
import Layout from "@/components/Layout";
import { Grid, Typography, Chip, Card, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

function AlbumDetails() {
    const router = useRouter();
    const { id } = router.query;

    return (
        <Layout centeredContent={false}>
            <Grid container spacing={3} className="container mx-auto p-6">
                {/* Columna de la izquierda */}
                <Grid item xs={12} md={7}>
                    <Typography variant="subtitle1">Released in 2019</Typography>
                    <Typography variant="subtitle2">Added to collection: July 30, 2019</Typography>

                    <Typography variant="h6" gutterBottom>Labels</Typography>
                    <Chip label="Polydor" />
                    <Chip label="Polar" />

                    <Typography variant="h6" gutterBottom>Genres</Typography>
                    <Chip label="Electronic" clickable color="primary" />
                    <Chip label="Pop" clickable color="primary" />

                    {/* ...Continúa el resto de los componentes como Chip, etc. */}

                    <Accordion defaultExpanded>
                        <AccordionSummary>
                            <Typography variant="h6">Album Notes</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body1">
                                {/* Información sobre el álbum */}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                {/* Columna de la derecha */}
                <Grid item xs={12} md={5}>
                    <Typography variant="h6" gutterBottom>Listen Now</Typography>
                    <iframe
                        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                        frameBorder="0"  // Cambiado a frameBorder con 'B' en mayúscula.
                        height="450"
                        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                        src="https://embed.music.apple.com/us/album/1422648512?theme=light"
                        style={{ width: '100%', overflow: 'hidden', background: 'transparent', borderRadius: '15px' }}>
                    </iframe>

                    {/* Agrega los otros componentes como videos de YouTube, imágenes, etc. */}
                </Grid>
            </Grid>
        </Layout>
    );
}

export default AlbumDetails;




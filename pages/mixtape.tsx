import { NextPage } from "next";
import Layout from "@/components/Layout";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

type Mixtape = {
  _id: string;
  userName: string;
  artistName: string;
  trackName: string;
  discogsAlbumId: string;
  spotifyTrackId?: string;
};

type SpotifyPlayerProps = {
  spotifyTrackId: string;
};

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ spotifyTrackId }) => {
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



const Mixtape: NextPage = () => {


  return (
    <Layout>
      <main className="flex min-h-screen flex-col items-center p-24">
        <h2 className="text-xl font-bold mb-4">MIXTAPE</h2>

        {/* Listado de mixtapes */}
        <TableContainer className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-lg">
        <Table>
  <TableHead>
    <TableRow>
      <TableCell className="px-4 py-2 font-bold">Usuario</TableCell>
      <TableCell className="px-4 py-2 font-bold">Artista</TableCell>
      <TableCell className="px-4 py-2 font-bold">Título de la Pista</TableCell>
      <TableCell className="px-4 py-2 font-bold">Reproductor Spotify</TableCell> {/* Encabezado para el reproductor */}
    </TableRow>
  </TableHead>
  <TableBody>

  </TableBody>
</Table>

          
        </TableContainer>
      </main>
    </Layout>
  );
};

export default Mixtape;

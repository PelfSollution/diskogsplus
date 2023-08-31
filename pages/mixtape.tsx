import { NextPage } from "next";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
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
  // @ts-ignore
  const mixtape = useQuery(api.getMixtape.list);

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
    {mixtape &&
      mixtape.map((mixtapeItem: Mixtape) => (
        <TableRow key={mixtapeItem._id.toString()}>
          <TableCell className="border px-4 py-2">{mixtapeItem.userName}</TableCell>
          <TableCell className="border px-4 py-2">{mixtapeItem.artistName}</TableCell>
          <TableCell className="border px-4 py-2">{mixtapeItem.trackName}</TableCell>
          <TableCell className="border px-4 py-2">
            {mixtapeItem.spotifyTrackId ? ( // Si existe spotifyTrackId, renderizamos el reproductor
              <SpotifyPlayer spotifyTrackId={mixtapeItem.spotifyTrackId} />
            ) : (
              'No disponible' // Puedes dejar esto vacío o mostrar un mensaje que indique que no hay link a Spotify
            )}
          </TableCell>
        </TableRow>
      ))}
  </TableBody>
</Table>

          
        </TableContainer>
      </main>
    </Layout>
  );
};

export default Mixtape;

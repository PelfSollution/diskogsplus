import { useQuery } from "convex/react";
import Layout from "@/components/Layout";
import { api } from "../convex/_generated/api";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

type Track = {
  _id: string;
  artist: string;
  trackTitle: string;
};


export default function Convex() {


  // @ts-ignore
  const tracks = useQuery(api.tracks.list) || [];
  console.log(tracks);
  return (
    <Layout>
    <main className="flex min-h-screen flex-col items-center p-24">
      <h2 className="text-xl font-bold mb-4">MIXTAPE</h2>

      {/* Listado de tracks */}
      <TableContainer className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-lg">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="px-4 py-2 font-bold">Artista</TableCell>
              <TableCell className="px-4 py-2 font-bold">Título de la Pista</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tracks.map((tracks: Track) => (
              <TableRow key={tracks._id.toString()}>
                <TableCell className="border px-4 py-2">{tracks.artist}</TableCell>
                <TableCell className="border px-4 py-2">{tracks.trackTitle}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </main>
  </Layout>
  );
}

import { useQuery } from "convex/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api } from "../convex/_generated/api";

export default function Mixtape() {

  
  
  const mixtape = useQuery(api.mixtapes.get);
  const tracks = useQuery(api.tracks.get);

  if (!mixtape || !tracks) return null;

const trackMap: Record<string, { artist: string; trackTitle: string }> = tracks.reduce((acc, track) => {
  acc[track._id] = track;
  return acc;
}, {});



  

  console.log(mixtape);
  console.log(tracks);

  return (
    <Layout>
    <main className="flex min-h-screen flex-col items-center p-24">
      {mixtape.map(({ _id, mixtapeName, tracks: trackIds }) => (
        <div key={_id.toString()}>
          <h2 className="text-xl font-bold mb-4">{mixtapeName}</h2>

          {/* Listado de tracks */}
          <ul>
            {trackIds.map((trackId: string, index: number) => {
              const track = trackMap[trackId];
              if (track) { // Verificamos que track existe en el mapa
                return (
                  <li key={index}>Tema: {track.artist} - {track.trackTitle}</li>
                );
              }
              return null; // Si no existe, no renderizamos nada
            })}
          </ul>
        </div>
      ))}
    </main>
  </Layout>
  );
}

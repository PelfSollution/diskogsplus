import { useQuery } from "convex/react";
import Layout from "@/components/Layout";
import { api } from "../convex/_generated/api";

export default function Convex() {

  // @ts-ignore
  const tracks = useQuery(api.tracks.get);
  console.log(tracks);
  return (
    <Layout>
      <main className="flex min-h-screen flex-col items-center p-24">
  
        <h2 className="text-xl font-bold mb-4">MIXTAPE</h2>

        {/* Listado de tracks */}
        <ul>
          {tracks && tracks.map(({trackTitle, artist}, index) => ( // <-- Check if tracks is defined
            <li key={index}>{artist} - {trackTitle}</li>
          ))}
        </ul>
      </main>
    </Layout>
  );
}

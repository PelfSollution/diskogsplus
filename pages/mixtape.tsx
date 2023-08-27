import { useQuery } from "convex/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api } from "../convex/_generated/api";

export default function Convex() {
  const mixtape = useQuery(api.mixtapes.get);
  console.log(mixtape);

  return (
    <Layout>
      <main className="flex min-h-screen flex-col items-center p-24">
        {mixtape?.map(({ _id, mixtapeName, tracks }) => (
          <div key={_id.toString()}>
            <h2 className="text-xl font-bold mb-4">{mixtapeName}</h2>

            {/* Listado de tracks */}
            <ul>
              {tracks.map((trackId: string, index: number) => (
                <li key={index}>Tema: {trackId}</li>
              ))}
            </ul>
          </div>
        ))}
      </main>
    </Layout>
  );
}

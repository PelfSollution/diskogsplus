import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import getMixtape from '../services/supabase/getMixtape';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

type Mixtape = {
  id: number;
  username: string;
  artistname: string;
  trackname: string;
  discogsalbumid: string;
  spotifytrackid?: string | null;
};

type SpotifyPlayerProps = {
  spotifyTrackId: string;
};

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  spotifyTrackId,
}) => {
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

export default function Mixtape() {
  const [mixtape, setMixtapes] = useState<Mixtape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMixtape();
  
        setMixtapes(data);
      } catch (err) {
        console.error('Error obteniendo datos:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  
    fetchData();
  }, []);

  return (
    <Layout>
    <div className="tw-border tw-border-gray-200">
      {/* Cabecera */}
      <div className="tw-flex tw-border-b tw-p-2 tw-bg-gray-100">
        <div className="tw-flex-1 tw-font-bold">ARTISTA</div>
        <div className="tw-flex-1 tw-font-bold">CANCIÓN</div>
        <div className="tw-flex-1 tw-font-bold">SPOTIFY</div>
      </div>

      {/* Cuerpo */}
      {mixtape.length === 0 ? (
        <div className="tw-p-2">No hay datos disponibles</div>
      ) : (
        mixtape.map((data) => (
          <div key={data.id} className="tw-flex tw-border-b tw-p-2">
              <div className="tw-flex-1 tw-font-bold">{data.artistname}</div>
    <div className="tw-flex-1 tw-italic tw-text-left">{data.trackname}</div> 
    <div className="tw-flex-1">
              {data.spotifytrackid ? (
                <SpotifyPlayer spotifyTrackId={data.spotifytrackid} />
              ) : (
                "No está en Spotify"
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </Layout>
  );
}

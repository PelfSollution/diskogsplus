// components/MixtapeRow.tsx

import { useState, useEffect, memo } from "react";

type MixtapeRowProps = {
    data: Mixtape;
    onDelete: (track: Mixtape) => void;
  };

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
  
  
  export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = memo(({ spotifyTrackId }) => {
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
  });

  
  const MixtapeRow: React.FC<MixtapeRowProps> = ({ data, onDelete }) => {
    return (
      <div className="tw-flex tw-border-b tw-p-2">
        <div className="tw-flex-1 tw-font-bold">{data.artistname}</div>
        <div className="tw-flex-1 tw-italic tw-text-left">{data.trackname}</div>
        <div className="tw-flex-1">
          {data.spotifytrackid ? (
            <SpotifyPlayer spotifyTrackId={data.spotifytrackid} />
          ) : (
            "No está en Spotify"
          )}
        </div>
        <div className="tw-flex-1 tw-italic tw-text-left">{data.username}</div>
        <div className="tw-flex tw-justify-center tw-items-center tw-flex-none">
          <button
            className="tw-text-red-600 tw-border tw-border-red-600 tw-px-2 tw-py-1 tw-rounded"
            onClick={() => onDelete(data)}
          >
            Eliminar
          </button>
        </div>
      </div>
    );
  };
  
  export default MixtapeRow;
  
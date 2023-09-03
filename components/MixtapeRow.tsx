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
    <div className="tw-w-1/5 tw-flex tw-items-center tw-flex-1 tw-text-left tw-font-bold">{data.artistname}</div>
    <div className="tw-w-1/5 tw-flex tw-items-center tw-flex-1 tw-italic tw-text-left">
        <a 
          href={`/albums/${data.discogsalbumid}`} 
          className="tw-text-gray-500 tw-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {data.trackname}
        </a>
    </div>
    <div className="tw-w-[300px] tw-flex tw-items-center tw-justify-center">
    {data.spotifytrackid ? (
        <SpotifyPlayer spotifyTrackId={data.spotifytrackid} />
    ) : (
        <span>No está en Spotify</span>
    )}
</div>

    <div className="tw-w-1/5 tw-flex tw-items-center tw-flex-1 tw-italic tw-text-left tw-ml-4">
        {data.username}
    </div>
    <div className="tw-w-1/5 tw-flex tw-justify-center tw-items-center tw-flex-none">
        <button
          className="tw-text-red-600 tw-border tw-border-red-600 tw-px-2 tw-py-1 tw-rounded"
          onClick={() => onDelete(data)}
        >
          Eliminar
        </button>
    </div>
</div>


    
    );
    MixtapeRow.displayName = "MixtapeRow";
  };
  


  export default MixtapeRow;
  
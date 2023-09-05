import { memo } from "react";
import Link from "next/link";

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

const SpotifyPlayerComponent: React.FC<SpotifyPlayerProps> = ({
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

export const SpotifyPlayer = memo(SpotifyPlayerComponent);
SpotifyPlayer.displayName = "SpotifyPlayer";

const MixtapeRowComponent: React.FC<MixtapeRowProps> = ({ data, onDelete }) => {
  return (
    <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-center tw-items-center tw-gap-y-4 md:tw-gap-x-8 tw-py-2 tw-px-2">

      {/* Primera columna: Embed de Spotify o mensaje */}
      <div className="tw-max-w-[350px] tw-w-full tw-flex tw-justify-center tw-items-center tw-mb-2 md:tw-mb-0">
        {data.spotifytrackid ? (
          <SpotifyPlayer spotifyTrackId={data.spotifytrackid} />
        ) : (
          <div className="tw-border tw-border-green-500 tw-rounded-lg tw-min-w-[302px] tw-min-h-[82px] tw-flex tw-justify-center tw-items-center">
            <span className="tw-text-green-500">No está en Spotify</span>
          </div>
        )}
      </div>

      {/* Segunda columna: Información y Botón */}
      <div className="tw-max-w-[350px] tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center md:tw-items-start">
        <span className="tw-font-bold tw-text-center md:tw-text-left tw-break-all">{data.artistname}</span>
        <Link
          key={data.discogsalbumid}
          href={`/albums/${data.discogsalbumid}`}
          className="tw-text-gray-500 tw-underline tw-text-center md:tw-text-left"
          target="_blank"
          rel="noopener noreferrer"
        >
          {data.trackname}
        </Link>
        <button
          className="tw-opacity-100 hover:tw-opacity-70 tw-text-red-600 tw-border tw-border-red-600 tw-px-2 tw-py-1 tw-rounded tw-mt-2 tw-w-full md:tw-w-auto tw-self-center md:tw-self-start"
          onClick={() => onDelete(data)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};





MixtapeRowComponent.displayName = "MixtapeRow";
export default memo(MixtapeRowComponent);

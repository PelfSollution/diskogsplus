import { memo } from "react";
import Link from "next/link";


type MixtapeRowProps = {
  data: Mixtape;
  onDelete: (track: Mixtape) => void;
};

type Mixtape = {
  id: number;
  username: string;
  artista: string;
  trackname: string;
  disco_id: string;
  spotifytrackid?: string | null;
  tempo?: number | null;
  key?: number | null;
  mode?: number | null;
  duration?: string | null;
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
        width="310"
        height="80"
        frameBorder="0"
        allow="encrypted-media"
      ></iframe>
    </div>
  );
};

export const SpotifyPlayer = memo(SpotifyPlayerComponent);
SpotifyPlayer.displayName = "SpotifyPlayer";

function getKeyNotation(key: number, modeNumber: number) {
 
  const pitchClasses = [
    "C",
    "C♯/D♭",
    "D",
    "D♯/E♭",
    "E",
    "F",
    "F♯/G♭",
    "G",
    "G♯/A♭",
    "A",
    "A♯/B♭",
    "B",
  ];

  const mode = modeNumber === 1 ? "major" : "minor";

  const camelotCodes: { [key: string]: string } = {
    "C major": "8B",
    "A minor": "8A",
    "G major": "9B",
    "E minor": "9A",
    "D major": "10B",
    "B minor": "10A",
    "A major": "11B",
    "F♯/G♭ minor": "11A",
    "E major": "12B",
    "C♯/D♭ minor": "12A",
    "B major": "1B",
    "G♯/A♭ minor": "1A",
    "F♯/G♭ major": "2B",
    "D♯/E♭ minor": "2A",
    "C♯/D♭ major": "3B",
    "A♯/B♭ minor": "3A",
    "F major": "4B",
    "D minor": "4A",
    "B♭ major": "5B",
    "G minor": "5A",
    "A♭ major": "6B",
    "F minor": "6A",
    "E♭ major": "7B",
    "C minor": "7A",
  };

  const pitchClassColors: { [key: string]: string } = {
    "1A": "tw-bg-yellow-200",
    "1B": "tw-bg-yellow-200",
    "2A": "tw-bg-yellow-300",
    "2B": "tw-bg-orange-200",
    "3A": "tw-bg-orange-200",
    "3B": "tw-bg-orange-200",
    "4A": "tw-bg-orange-300",
    "4B": "tw-bg-orange-300",
    "5A": "tw-bg-red-200",
    "5B": "tw-bg-red-200",
    "6A": "tw-bg-rose-200",
    "6B": "tw-bg-rose-200",
    "7A": "tw-bg-pink-200",
    "7B": "tw-bg-pink-200",
    "8A": "tw-bg-purple-200",
    "8B": "tw-bg-purple-200",
    "9A": "tw-bg-blue-200",
    "9B": "tw-bg-blue-200",
    "10A": "tw-bg-cyan-200",
    "10B": "tw-bg-cyan-200",
    "11A": "tw-bg-green-200",
    "11B": "tw-bg-green-200",
    "12A": "tw-bg-green-300",
    "12B": "tw-bg-green-300",
  };

  const notation = pitchClasses[key] || "N/A";

  // Agregamos un log aquí para ver qué se está produciendo para cada pista
 // console.log(`Intentando encontrar: ${notation} ${mode} en 'camelotCodes'`);

  if (!camelotCodes[`${notation} ${mode}`]) {
   /* console.log(
      `La combinación ${notation} ${mode} no se encuentra en 'camelotCodes'`
    );*/
    return {
      notation: `${notation} (N/A)`,
      color: "tw-bg-gray-400",
    };
  }

  const camelotCode = camelotCodes[`${notation} ${mode}`];
  //console.log(`Camelot code encontrado: ${camelotCode}`);

  return {
    notation: `${notation} (${camelotCode})`,
    color: pitchClassColors[camelotCode] || "tw-bg-gray-400",
  };
}

const MixtapeRowComponent: React.FC<MixtapeRowProps> = ({ data, onDelete }) => {
  return (

    
    <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-center tw-items-center tw-gap-y-4 md:tw-gap-x-8 tw-py-2 tw-px-2 tw-border tw-border-gray-200">
      {/* Primera columna: Embed de Spotify o mensaje */}
      <div className="tw-max-w-[350px] tw-w-full tw-flex tw-justify-center tw-items-center tw-mb-2 md:tw-mb-0">
        {data.spotifytrackid ? (
          <SpotifyPlayer spotifyTrackId={data.spotifytrackid} />
        ) : (
          <div className="tw-border tw-border-green-400 tw-rounded-lg tw-min-w-[350px] tw-min-h-[82px] tw-flex tw-justify-center tw-items-center">
            <span className="tw-text-green-400">No está en Spotify</span>
          </div>
        )}
      </div>

      {/* Segunda columna: Información y Botón */}
      <div className=" tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center md:tw-items-start">
        <span className="tw-font-bold tw-text-center md:tw-text-left tw-break-all">
          {data.artista}
        </span>
        <Link
          key={data.disco_id}
          href={`/albums/${data.disco_id}`}
          className="tw-text-gray-500 tw-underline tw-text-center md:tw-text-left"
        >
          {data.trackname}
        </Link>
        <div className="tw-flex tw-item-center tw-gap-2 tw-items-start tw-max-w-[100] tw-mt-2">
          {data.tempo && (
            <div className="tw-text-xs tw-bg-gray-200 tw-rounded-full tw-px-2 tw-py-1">
              {data.tempo.toFixed(0)}
            </div>
          )}

          {typeof data.key === "number" && typeof data.mode === "number" ? (
            <div
              className={`tw-text-xs tw-text-white tw-px-2 tw-py-1 tw-rounded-full ${
                getKeyNotation(data.key, data.mode).color
              }`}
            >
              {getKeyNotation(data.key, data.mode).notation}
            </div>
          ) : null}
        </div>

        <button
          className="tw-opacity-100 hover:tw-opacity-70 tw-text-red-400 tw-border tw-border-red-400 tw-px-2 tw-py-1 tw-rounded tw-mt-2 tw-w-full md:tw-w-auto tw-self-center md:tw-self-start"
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

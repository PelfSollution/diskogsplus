import React, { useState } from "react";
import { ChevronDown, Users, ExternalLink } from "lucide-react";

interface SimilarArtistItem {
  name: string;
  mbid?: string;
  match: string | number;
  url: string;
}

interface SimilarArtistsGridProps {
  artists: SimilarArtistItem[];
  artistName: string;
}

export const SimilarArtistsGrid: React.FC<SimilarArtistsGridProps> = ({
  artists = [],
  artistName,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-overflow-hidden tw-shadow-sm tw-mt-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-p-4 tw-flex tw-items-center tw-justify-between tw-text-left hover:tw-bg-gray-50 dark:hover:tw-bg-gray-750 tw-transition-colors"
      >
        <div className="tw-flex tw-items-center tw-gap-2.5">
          <Users className="tw-w-5 tw-h-5 tw-text-brand-500" />
          <span className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
            Artistas Similares
          </span>
          <span className="tw-text-xs tw-bg-brand-50 dark:tw-bg-brand-950/40 tw-text-brand-700 dark:tw-text-brand-300 tw-px-2 tw-py-0.5 tw-rounded-md">
            Last.fm
          </span>
        </div>
        <ChevronDown
          className={`tw-w-5 tw-h-5 tw-text-gray-400 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="tw-p-4 tw-pt-0 tw-border-t tw-border-gray-100 dark:tw-border-gray-700/60">
          {artists.length > 0 ? (
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-2.5 tw-mt-3">
              {artists.map((item, index) => {
                const matchPct = Math.round(Number(item.match) * 100);
                return (
                  <div
                    key={item.mbid || item.name || index}
                    className="tw-p-3 tw-rounded-xl tw-border tw-border-gray-100 dark:tw-border-gray-700 tw-bg-gray-50/50 dark:tw-bg-gray-850 tw-flex tw-flex-col tw-justify-between"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-text-sm tw-font-semibold tw-text-gray-800 dark:tw-text-gray-200 hover:tw-text-brand-600 dark:hover:tw-text-brand-400 tw-flex tw-items-center tw-gap-1 tw-truncate"
                      title={item.name}
                    >
                      <span className="tw-truncate">{item.name}</span>
                      <ExternalLink className="tw-w-3.5 tw-h-3.5 tw-shrink-0 tw-text-gray-400" />
                    </a>
                    <div className="tw-mt-2">
                      <span className="tw-text-xs tw-font-medium tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-brand-100 dark:tw-bg-brand-900/40 tw-text-brand-800 dark:tw-text-brand-300">
                        {matchPct}% coincidencia
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="tw-text-xs tw-text-gray-500 tw-mt-3">
              No hay artistas parecidos registrados en Last.fm para {artistName}.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimilarArtistsGrid;

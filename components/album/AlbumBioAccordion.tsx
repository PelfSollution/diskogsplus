import React, { useState } from "react";
import DOMPurify from "dompurify";
import { ChevronDown, Sparkles, BookOpen } from "lucide-react";

interface AlbumBioAccordionProps {
  artistBio?: string;
  enrichedInfo: string | null;
  onEnrichArtistInfo: () => void;
  isGenerating: boolean;
}

export const AlbumBioAccordion: React.FC<AlbumBioAccordionProps> = ({
  artistBio,
  enrichedInfo,
  onEnrichArtistInfo,
  isGenerating,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Sanitizar HTML devuelto por Last.fm
  const sanitizedBio = artistBio ? DOMPurify.sanitize(artistBio) : "";

  return (
    <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-overflow-hidden tw-shadow-sm tw-mt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-p-4 tw-flex tw-items-center tw-justify-between tw-text-left hover:tw-bg-gray-50 dark:hover:tw-bg-gray-750 tw-transition-colors"
      >
        <div className="tw-flex tw-items-center tw-gap-2.5">
          <BookOpen className="tw-w-5 tw-h-5 tw-text-brand-500" />
          <span className="tw-font-bold tw-text-gray-900 dark:tw-text-white tw-text-base">
            Biografía & Contexto
          </span>
          <span className="tw-text-xs tw-bg-gray-100 dark:tw-bg-gray-700 tw-text-gray-600 dark:tw-text-gray-300 tw-px-2 tw-py-0.5 tw-rounded-md">
            Last.fm + IA
          </span>
        </div>
        <ChevronDown
          className={`tw-w-5 tw-h-5 tw-text-gray-400 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="tw-p-4 tw-pt-0 tw-border-t tw-border-gray-100 dark:tw-border-gray-700/60 tw-space-y-4">
          {/* Biografía de Last.fm */}
          {sanitizedBio && (
            <div className="tw-mt-3">
              <div className="tw-text-xs tw-font-semibold tw-text-gray-500 dark:tw-text-gray-400 tw-uppercase tw-tracking-wider tw-mb-1.5">
                Biografía del Artista
              </div>
              <div
                className="tw-text-sm tw-text-gray-700 dark:tw-text-gray-300 tw-leading-relaxed bio-content"
                dangerouslySetInnerHTML={{ __html: sanitizedBio }}
              />
            </div>
          )}

          {/* Información Enriquecida con IA */}
          <div className="tw-mt-3 tw-p-3.5 tw-bg-brand-50/60 dark:tw-bg-brand-950/20 tw-rounded-xl tw-border tw-border-brand-100 dark:tw-border-brand-900/40">
            <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-brand-700 dark:tw-text-brand-300 tw-mb-2">
              <Sparkles className="tw-w-3.5 tw-h-3.5" />
              <span>Análisis Enriquecido con IA</span>
            </div>

            {enrichedInfo ? (
              <p className="tw-text-sm tw-text-gray-800 dark:tw-text-gray-200 tw-whitespace-pre-line tw-leading-relaxed">
                {enrichedInfo}
              </p>
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-2">
                <p className="tw-text-xs tw-text-gray-500 dark:tw-text-gray-400">
                  Obtén datos sobre la época, repercusión cultural e influencias del disco generados por IA.
                </p>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={onEnrichArtistInfo}
                  className="tw-self-start tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-lg tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-shadow-sm tw-transition-colors disabled:tw-opacity-50"
                >
                  {isGenerating ? "Generando texto..." : "Generar Información Enriquecida"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumBioAccordion;

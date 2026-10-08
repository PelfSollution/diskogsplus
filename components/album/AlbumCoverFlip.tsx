import React from "react";
import Image from "next/image";

interface AlbumCoverFlipProps {
  coverImage: string | null;
  backCoverImage: string | null;
  artist: string;
  title: string;
  isFlipped: boolean;
  onFlip: () => void;
  isGenerating: boolean;
  onGenerateImage: () => void;
}

export const AlbumCoverFlip: React.FC<AlbumCoverFlipProps> = ({
  coverImage,
  backCoverImage,
  artist,
  title,
  isFlipped,
  onFlip,
  isGenerating,
  onGenerateImage,
}) => {
  const currentImage = isFlipped ? backCoverImage || "/no-portada.gif" : coverImage || "/no-portada.gif";
  const altText = `${artist} - ${title} ${isFlipped ? "contraportada" : "portada"}`;
  const isGenerated = currentImage.includes("generated_images");

  return (
    <div className="tw-flex tw-flex-col tw-items-center">
      <div
        className={`tw-relative tw-w-40 tw-h-40 md:tw-w-64 md:tw-h-64 tw-cursor-pointer tw-select-none tw-perspective-[1000px] tw-group ${
          isGenerating ? "tw-pointer-events-none tw-opacity-80" : ""
        }`}
        onClick={onFlip}
        title="Haz clic para voltear la portada"
      >
        <div
          className={`tw-w-full tw-h-full tw-rounded-2xl tw-overflow-hidden tw-shadow-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-transition-transform tw-duration-700 tw-relative tw-bg-gray-100 dark:tw-bg-gray-800 ${
            isFlipped ? "tw-rotate-y-180" : ""
          }`}
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Imagen de Portada */}
          <div className="tw-w-full tw-h-full tw-relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={altText}
              className="tw-w-full tw-h-full tw-object-cover"
            />
          </div>

          {/* Overlay sutil al pasar el cursor */}
          <div className="tw-absolute tw-inset-0 tw-bg-black/20 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-flex tw-items-end tw-justify-center tw-p-2">
            <span className="tw-text-white tw-text-xs tw-bg-black/60 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md">
              🔄 Clic para girar
            </span>
          </div>
        </div>
      </div>

      {/* Botón de Generar Imagen IA */}
      <div className="tw-mt-2.5">
        <button
          type="button"
          disabled={isGenerating}
          onClick={(e) => {
            e.stopPropagation();
            onGenerateImage();
          }}
          className="tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-brand-300 dark:tw-border-brand-800 tw-bg-brand-50 dark:tw-bg-brand-950/40 tw-text-brand-700 dark:tw-text-brand-300 hover:tw-bg-brand-100 dark:hover:tw-bg-brand-900/50 tw-transition-all tw-flex tw-items-center tw-gap-1.5"
        >
          <span>✨</span>
          <span>
            {isGenerating
              ? "Generando arte..."
              : isGenerated
              ? "Regenerar Imagen IA"
              : "Generar Arte IA"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AlbumCoverFlip;

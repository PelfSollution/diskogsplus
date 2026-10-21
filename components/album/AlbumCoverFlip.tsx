import React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import VinylDisc from "@/components/VinylDisc";

interface AlbumCoverFlipProps {
  coverImage: string | null;
  backCoverImage: string | null;
  artist: string;
  title: string;
  isFlipped: boolean;
  onFlip: () => void;
  isGenerating: boolean;
  onGenerateImage: () => void;
  /** El vinilo gira mientras suena el disco */
  isPlaying?: boolean;
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
  isPlaying = false,
}) => {
  const currentImage = isFlipped ? backCoverImage || "/no-portada.gif" : coverImage || "/no-portada.gif";
  const altText = `${artist} - ${title} ${isFlipped ? "contraportada" : "portada"}`;
  const isGenerated = currentImage.includes("generated_images");

  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-3">
      {/* Funda delante y vinilo asomando por la derecha, con la portada en la galleta */}
      <div className="tw-relative tw-w-[300px] sm:tw-w-[400px] tw-max-w-full">
        <div className="tw-absolute tw-top-[2%] tw-right-0 tw-w-[66%]" aria-hidden="true">
          <VinylDisc size="fill" cover={coverImage} spinning={isPlaying} />
        </div>
        <button
          type="button"
          onClick={onFlip}
          disabled={isGenerating}
          title={isFlipped ? "Ver la portada" : "Ver la contraportada"}
          aria-label={isFlipped ? "Ver la portada" : "Ver la contraportada"}
          className="tw-group tw-relative tw-block tw-w-[70%] tw-aspect-square tw-rounded-md tw-overflow-hidden tw-bg-gray-100 tw-shadow-[0_2px_4px_rgb(0_0_0/0.08),0_18px_40px_rgb(28_25_23/0.22)] disabled:tw-opacity-80"
          style={{ perspective: "1000px" }}
        >
          <span
            className="tw-block tw-w-full tw-h-full tw-transition-transform tw-duration-700"
            style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)", transformStyle: "preserve-3d" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={altText}
              className="tw-w-full tw-h-full tw-object-cover"
              style={{ transform: isFlipped ? "rotateY(180deg)" : undefined }}
            />
          </span>
          <span className="tw-absolute tw-bottom-2 tw-left-2 tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-medium tw-text-white tw-bg-black/55 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-opacity-0 group-hover:tw-opacity-100 group-focus-visible:tw-opacity-100 tw-transition-opacity">
            <RefreshCw className="tw-w-3 tw-h-3" />
            {isFlipped ? "Portada" : "Contraportada"}
          </span>
        </button>
      </div>

      <button
        type="button"
        disabled={isGenerating}
        onClick={onGenerateImage}
        className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-gray-600 hover:tw-text-gray-900 tw-px-2 tw-py-1 tw-rounded-md hover:tw-bg-white/70 tw-transition-colors disabled:tw-opacity-60"
      >
        <Sparkles className="tw-w-3.5 tw-h-3.5" />
        {isGenerating ? "Generando arte…" : isGenerated ? "Regenerar arte con IA" : "Generar arte con IA"}
      </button>
    </div>
  );
};

export default AlbumCoverFlip;

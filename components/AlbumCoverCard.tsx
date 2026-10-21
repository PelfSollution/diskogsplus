import React from "react";
import Image from "next/image";
import Link from "next/link";
import VinylDisc from "@/components/VinylDisc";

type AlbumCoverCardProps = {
  href: string;
  cover?: string | null;
  title: string;
  artist: string;
  /** Línea extra bajo el artista (p. ej. «En tu wantlist») */
  extra?: React.ReactNode;
};

/**
 * Portada de un disco en una cuadrícula (colección, wantlist): título y
 * artista debajo y, al pasar el ratón, el vinilo asoma por detrás.
 */
export default function AlbumCoverCard({ href, cover, title, artist, extra }: AlbumCoverCardProps) {
  const image = cover || "/no-portada.gif";
  return (
    <Link href={href} className="tw-group tw-flex tw-flex-col tw-gap-2.5">
      <div className="tw-relative tw-aspect-square">
        <div className="tw-absolute tw-inset-[4%] tw-transition-transform tw-duration-500 tw-ease-out group-hover:tw-translate-x-[22%]">
          <VinylDisc size="fill" cover={image} flat />
        </div>
        <div className="tw-relative tw-w-full tw-h-full tw-rounded-md tw-overflow-hidden tw-bg-gray-100 tw-shadow-sm group-hover:tw-shadow-lg tw-transition-shadow">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="tw-object-cover"
          />
        </div>
      </div>
      <div className="tw-min-w-0">
        <h2 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-truncate" title={title}>
          {title}
        </h2>
        <p className="tw-text-[13px] tw-text-gray-500 tw-truncate">{artist}</p>
        {extra}
      </div>
    </Link>
  );
}

/** Cuadrícula de portadas compartida por la colección y la wantlist. */
export const COVER_GRID =
  "tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 lg:tw-grid-cols-4 xl:tw-grid-cols-5 tw-gap-x-6 tw-gap-y-8";

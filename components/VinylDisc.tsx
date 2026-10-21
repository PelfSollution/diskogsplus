import React from "react";

type VinylDiscProps = {
  /** Diámetro en px, o "fill" para ocupar el ancho del contenedor */
  size: number | "fill";
  /** Portada que hace de galleta central; sin ella, labelColor o el acento */
  cover?: string | null;
  /** Varias portadas: la galleta se divide en un mosaico de 2×2 (mixtapes) */
  covers?: (string | null | undefined)[];
  labelColor?: string;
  spinning?: boolean;
  paused?: boolean;
  /** Sin sombra, para iconos pequeños */
  flat?: boolean;
  className?: string;
  label?: string;
};

/**
 * Vinilo con surcos y la portada como galleta (docs/design.md §5).
 * Es decorativo salvo que reciba `label`, que lo expone como imagen.
 */
export default function VinylDisc({
  size,
  cover,
  covers,
  labelColor,
  spinning = false,
  paused = false,
  flat = false,
  className = "",
  label,
}: VinylDiscProps) {
  const mosaic = (covers || []).filter(Boolean).slice(0, 4) as string[];
  const classes = [
    "vinyl-disc",
    spinning ? "vinyl-disc--spin" : "",
    spinning && paused ? "vinyl-disc--paused" : "",
    flat ? "vinyl-disc--flat" : "",
    className,
  ].join(" ");

  return (
    <div
      className={classes}
      style={
        size === "fill"
          ? { width: "100%", aspectRatio: "1 / 1" }
          : { width: size, height: size, flex: `0 0 ${size}px` }
      }
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div
        className="tw-relative tw-z-[1] tw-rounded-full tw-overflow-hidden tw-bg-brand-600"
        style={{ width: "38%", height: "38%", background: cover || mosaic.length ? undefined : labelColor }}
      >
        {mosaic.length > 1 ? (
          <div className="tw-grid tw-grid-cols-2 tw-w-full tw-h-full">
            {[0, 1, 2, 3].map((i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={mosaic[i % mosaic.length]} alt="" className="tw-w-full tw-h-full tw-object-cover" />
            ))}
          </div>
        ) : cover || mosaic[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(cover || mosaic[0]) as string} alt="" className="tw-w-full tw-h-full tw-object-cover" />
        ) : null}
      </div>
      {(size === "fill" || size >= 40) && (
        <span
          className="tw-absolute tw-z-[2] tw-rounded-full tw-bg-gray-100"
          style={{ width: "4.5%", height: "4.5%" }}
        />
      )}
    </div>
  );
}

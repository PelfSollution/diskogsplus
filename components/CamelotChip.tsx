import React from "react";
import { getCamelotHex, getPitchClassNotation } from "@/lib/musicNotation";

type CamelotChipProps = {
  keyIndex?: number | null;
  mode?: number | null;
  /** Texto añadido tras el código («· encaja») */
  suffix?: string;
  className?: string;
};

/**
 * Etiqueta de tonalidad Camelot (docs/design.md §5): fondo suave, borde y
 * punto del color de la tonalidad, con el texto oscuro para que se lea.
 */
export default function CamelotChip({ keyIndex, mode, suffix, className = "" }: CamelotChipProps) {
  if (typeof keyIndex !== "number" || typeof mode !== "number") return null;
  const { note, camelotCode } = getPitchClassNotation(keyIndex, mode);
  const hex = getCamelotHex(camelotCode);
  if (!hex) return null;

  return (
    <span
      title={`${note} ${mode === 1 ? "mayor" : "menor"}`}
      className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-px-1.5 tw-py-0.5 tw-rounded-md tw-border tw-font-mono tw-text-xs tw-font-semibold tw-text-gray-800 tw-whitespace-nowrap ${className}`}
      style={{ background: `${hex}1F`, borderColor: `${hex}59` }}
    >
      <span className="tw-w-2 tw-h-2 tw-rounded-full" style={{ background: hex }} />
      {camelotCode}
      {suffix && <span className="tw-font-sans tw-font-medium">{suffix}</span>}
    </span>
  );
}

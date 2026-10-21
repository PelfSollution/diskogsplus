import React from "react";
import VinylDisc from "@/components/VinylDisc";

/** Indicador de carga: un vinilo girando (docs/design.md §5). */
const CustomCircularProgress: React.FC = () => {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3" role="status">
      <VinylDisc size={56} spinning />
      <span className="tw-sr-only">Cargando…</span>
    </div>
  );
};

export default CustomCircularProgress;

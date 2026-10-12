import React from "react";
import { ListMusic } from "lucide-react";
import type { MixtapeInfo } from "@/services/client/mixtape";

interface MixtapeSelectProps {
  mixtapes: MixtapeInfo[];
  activeId: number | null | undefined;
  onChange: (id: number) => void;
}

/** «Añadir a: [mixtape]»: elige la mixtape activa desde la ficha del disco. */
export default function MixtapeSelect({ mixtapes, activeId, onChange }: MixtapeSelectProps) {
  return (
    <label className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-gray-500 dark:tw-text-gray-400">
      <ListMusic className="tw-w-3.5 tw-h-3.5 tw-text-vinyl-500" />
      <span>Añadir a</span>
      <select
        value={activeId ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tw-min-w-0 tw-max-w-[14rem] tw-truncate tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-lg tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white tw-outline-none focus:tw-border-vinyl-500"
      >
        {mixtapes.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

import React, { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import {
  createMixtape,
  renameMixtape,
  deleteMixtape,
  MixtapeInfo,
} from "@/services/client/mixtape";

interface MixtapeManagerProps {
  active: MixtapeInfo | null;
  /** Abrir el formulario de «Nueva mixtape» (desde el «+» de la barra lateral) */
  createRequested: boolean;
  onCreateClosed: () => void;
  onSelect: (id: number) => void;
  /** Recargar la lista tras crear, renombrar o borrar */
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
}

type Mode = { kind: "idle" } | { kind: "create" } | { kind: "rename" } | { kind: "delete" };

const inputClass =
  "tw-min-w-0 tw-flex-1 tw-h-10 tw-px-3 tw-text-sm tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-text-gray-900 placeholder:tw-text-gray-400 tw-outline-none focus:tw-border-brand-600 focus:tw-ring-2 focus:tw-ring-brand-600/20";
const iconButtonClass =
  "tw-w-9 tw-h-9 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-text-gray-500 hover:tw-text-gray-900 hover:tw-bg-gray-100 tw-transition-colors";

/**
 * Acciones sobre las mixtapes en la cabecera de /mixtape: renombrar y borrar
 * la activa (iconos junto al título) y crear una nueva. Elegir la activa se
 * hace en la barra lateral.
 */
export default function MixtapeManager({
  active,
  createRequested,
  onCreateClosed,
  onSelect,
  onChanged,
  onMessage,
}: MixtapeManagerProps) {
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  // El «+» de la barra lateral abre el formulario de creación
  const currentMode: Mode = createRequested && mode.kind === "idle" ? { kind: "create" } : mode;

  const startRename = () => {
    setName(active?.nombre ?? "");
    setMode({ kind: "rename" });
  };

  const cancel = () => {
    setMode({ kind: "idle" });
    setName("");
    onCreateClosed();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = name.trim();
    if (!nombre || busy) return;
    setBusy(true);
    try {
      if (currentMode.kind === "create") {
        const result = await createMixtape(nombre);
        if (typeof result === "string") return onMessage(result);
        onSelect(result.id);
        onMessage(`Mixtape «${result.nombre}» creada. Las pistas que añadas irán a ella.`);
      } else if (currentMode.kind === "rename" && active) {
        const error = await renameMixtape(active.id, nombre);
        if (error) return onMessage(error);
        onMessage(`Mixtape renombrada a «${nombre}».`);
      }
      cancel();
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!active || busy) return;
    setBusy(true);
    try {
      if (await deleteMixtape(active.id)) {
        onMessage(`Mixtape «${active.nombre}» borrada.`);
        cancel();
        await onChanged();
      } else {
        onMessage("No se pudo borrar la mixtape.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {active && currentMode.kind === "idle" && (
        <div className="tw-flex tw-items-center tw-gap-1">
          <button type="button" onClick={startRename} className={iconButtonClass} title="Renombrar" aria-label="Renombrar mixtape">
            <Pencil className="tw-w-4 tw-h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMode({ kind: "delete" })}
            className={`${iconButtonClass} hover:tw-text-red-600 hover:tw-bg-red-50`}
            title="Borrar"
            aria-label="Borrar mixtape"
          >
            <Trash2 className="tw-w-4 tw-h-4" />
          </button>
        </div>
      )}

      {(currentMode.kind === "create" || currentMode.kind === "rename") && (
        <form onSubmit={handleSubmit} className="tw-flex tw-items-center tw-gap-2 tw-max-w-md">
          <input
            autoFocus
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && cancel()}
            placeholder="Sesión jazz-funk sábado"
            aria-label={currentMode.kind === "create" ? "Nombre de la nueva mixtape" : "Nuevo nombre"}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="tw-flex tw-items-center tw-gap-1.5 tw-h-10 tw-px-4 tw-rounded-lg tw-bg-brand-600 hover:tw-bg-brand-700 disabled:tw-opacity-50 tw-text-white tw-text-sm tw-font-semibold tw-transition-colors"
          >
            <Check className="tw-w-4 tw-h-4" />
            <span>{currentMode.kind === "create" ? "Crear" : "Guardar"}</span>
          </button>
          <button type="button" onClick={cancel} className={iconButtonClass} aria-label="Cancelar">
            <X className="tw-w-4 tw-h-4" />
          </button>
        </form>
      )}

      {active && currentMode.kind === "delete" && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-p-3 tw-rounded-xl tw-bg-red-50 tw-border tw-border-red-200 tw-max-w-xl">
          <span className="tw-flex-1 tw-text-sm tw-text-red-700">
            ¿Borrar «{active.nombre}»
            {active.pistas > 0 ? ` y sus ${active.pistas} pistas` : ""}? No se puede deshacer.
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="tw-h-9 tw-px-4 tw-rounded-lg tw-bg-red-600 hover:tw-bg-red-700 disabled:tw-opacity-50 tw-text-white tw-text-sm tw-font-semibold tw-transition-colors"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={cancel}
            className="tw-h-9 tw-px-4 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-text-gray-700 hover:tw-bg-gray-50 tw-text-sm tw-font-medium tw-transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  createMixtape,
  renameMixtape,
  deleteMixtape,
  MixtapeInfo,
} from "@/services/client/mixtape";

interface MixtapeManagerProps {
  mixtapes: MixtapeInfo[];
  activeId: number | null | undefined;
  onSelect: (id: number) => void;
  /** Recargar la lista tras crear, renombrar o borrar */
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
}

type Mode = { kind: "idle" } | { kind: "create" } | { kind: "rename" } | { kind: "delete" };

const inputClass =
  "tw-min-w-0 tw-flex-1 tw-px-3 tw-py-1.5 tw-text-sm tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-gray-50 dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-white placeholder:tw-text-gray-400 tw-outline-none focus:tw-border-vinyl-500 focus:tw-ring-2 focus:tw-ring-vinyl-500/20";
const iconButtonClass =
  "tw-p-2 tw-rounded-full tw-text-gray-500 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700 tw-transition-colors";

/** Chips con las mixtapes del usuario: elegir la activa, crear, renombrar y borrar. */
export default function MixtapeManager({
  mixtapes,
  activeId,
  onSelect,
  onChanged,
  onMessage,
}: MixtapeManagerProps) {
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const active = mixtapes.find((m) => m.id === activeId);

  const startCreate = () => {
    setName("");
    setMode({ kind: "create" });
  };

  const startRename = () => {
    setName(active?.nombre ?? "");
    setMode({ kind: "rename" });
  };

  const cancel = () => setMode({ kind: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = name.trim();
    if (!nombre || busy) return;
    setBusy(true);
    try {
      if (mode.kind === "create") {
        const result = await createMixtape(nombre);
        if (typeof result === "string") return onMessage(result);
        onSelect(result.id);
        onMessage(`Mixtape «${result.nombre}» creada. Las pistas que añadas irán a ella.`);
      } else if (mode.kind === "rename" && active) {
        const error = await renameMixtape(active.id, nombre);
        if (error) return onMessage(error);
        onMessage(`Mixtape renombrada a «${nombre}».`);
      }
      setMode({ kind: "idle" });
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
        setMode({ kind: "idle" });
        await onChanged();
      } else {
        onMessage("No se pudo borrar la mixtape.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-p-4 tw-mb-6">
      {/* Chips de mixtapes */}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {mixtapes.map((m) => {
          const selected = m.id === activeId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelect(m.id);
                setMode({ kind: "idle" });
              }}
              aria-pressed={selected}
              className={`tw-flex tw-items-center tw-gap-1.5 tw-max-w-full tw-px-3.5 tw-py-1.5 tw-rounded-full tw-text-sm tw-font-semibold tw-border tw-transition-colors ${
                selected
                  ? "tw-bg-vinyl-500 tw-border-vinyl-600 tw-text-white tw-shadow-sm"
                  : "tw-bg-gray-50 dark:tw-bg-gray-900 tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-700 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700"
              }`}
            >
              <span className="tw-truncate">{m.nombre}</span>
              <span className={`tw-text-xs ${selected ? "tw-text-white/80" : "tw-text-gray-400"}`}>
                {m.pistas}
              </span>
            </button>
          );
        })}

        {mode.kind !== "create" && (
          <button
            type="button"
            onClick={startCreate}
            className="tw-flex tw-items-center tw-gap-1 tw-px-3.5 tw-py-1.5 tw-rounded-full tw-text-sm tw-font-medium tw-border tw-border-dashed tw-border-gray-300 dark:tw-border-gray-600 tw-text-gray-600 dark:tw-text-gray-300 hover:tw-border-vinyl-500 hover:tw-text-vinyl-600 tw-transition-colors"
          >
            <Plus className="tw-w-3.5 tw-h-3.5" />
            <span>Nueva</span>
          </button>
        )}
      </div>

      {/* Crear o renombrar */}
      {(mode.kind === "create" || mode.kind === "rename") && (
        <form onSubmit={handleSubmit} className="tw-flex tw-items-center tw-gap-2 tw-mt-3">
          <input
            autoFocus
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && cancel()}
            placeholder="Sesión jazz-funk sábado"
            aria-label={mode.kind === "create" ? "Nombre de la nueva mixtape" : "Nuevo nombre"}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="tw-flex tw-items-center tw-gap-1.5 tw-px-4 tw-py-1.5 tw-rounded-xl tw-bg-vinyl-500 hover:tw-bg-vinyl-600 disabled:tw-opacity-50 tw-text-white tw-text-sm tw-font-semibold tw-shadow-sm tw-transition-colors"
          >
            <Check className="tw-w-4 tw-h-4" />
            <span>{mode.kind === "create" ? "Crear" : "Guardar"}</span>
          </button>
          <button type="button" onClick={cancel} className={iconButtonClass} aria-label="Cancelar">
            <X className="tw-w-4 tw-h-4" />
          </button>
        </form>
      )}

      {/* Mixtape activa: renombrar y borrar */}
      {active && mode.kind === "idle" && (
        <div className="tw-flex tw-items-center tw-gap-1 tw-mt-3 tw-text-xs tw-text-gray-500 dark:tw-text-gray-400">
          <span className="tw-flex-1">
            Las pistas que añadas desde los discos irán a «{active.nombre}».
          </span>
          <button type="button" onClick={startRename} className={iconButtonClass} title="Renombrar" aria-label="Renombrar mixtape">
            <Pencil className="tw-w-4 tw-h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMode({ kind: "delete" })}
            className={`${iconButtonClass} hover:tw-text-red-600`}
            title="Borrar"
            aria-label="Borrar mixtape"
          >
            <Trash2 className="tw-w-4 tw-h-4" />
          </button>
        </div>
      )}

      {/* Confirmar borrado */}
      {active && mode.kind === "delete" && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-mt-3 tw-p-3 tw-rounded-xl tw-bg-red-50 dark:tw-bg-red-950/40 tw-border tw-border-red-200 dark:tw-border-red-900">
          <span className="tw-flex-1 tw-text-sm tw-text-red-700 dark:tw-text-red-300">
            ¿Borrar «{active.nombre}»
            {active.pistas > 0 ? ` y sus ${active.pistas} pistas` : ""}? No se puede deshacer.
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="tw-px-4 tw-py-1.5 tw-rounded-xl tw-bg-red-600 hover:tw-bg-red-700 disabled:tw-opacity-50 tw-text-white tw-text-sm tw-font-semibold tw-shadow-sm tw-transition-colors"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={cancel}
            className="tw-px-4 tw-py-1.5 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-700 dark:tw-text-gray-200 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800 tw-text-sm tw-font-medium tw-transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

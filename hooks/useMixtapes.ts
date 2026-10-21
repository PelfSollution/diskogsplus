import { useState, useEffect, useCallback } from "react";
import { getMixtapes, MixtapeInfo, MIXTAPES_CHANGED_EVENT } from "@/services/client/mixtape";

const ACTIVE_KEY = "diskogs_active_mixtape_";
const ACTIVE_CHANGED_EVENT = "diskogs:active-mixtape-changed";

function readActive(username: string): number | null {
  try {
    const value = Number(localStorage.getItem(ACTIVE_KEY + username));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeActive(username: string, id: number) {
  try {
    localStorage.setItem(ACTIVE_KEY + username, String(id));
  } catch {
    // Sin almacenamiento: la selección dura lo que la página
  }
}

/**
 * Mixtapes del usuario y la mixtape activa (a la que se añaden pistas desde
 * la ficha del disco). La activa se recuerda en localStorage.
 *
 * activeId: undefined mientras carga · null en modo local (sin Supabase).
 */
function useMixtapes(username: string) {
  const [mixtapes, setMixtapes] = useState<MixtapeInfo[] | null>(null);
  const [activeId, setActiveIdState] = useState<number | null | undefined>(undefined);

  const reload = useCallback(async () => {
    if (!username) return;
    const list = await getMixtapes();
    setMixtapes(list);
    if (!list) {
      setActiveIdState(null);
      return;
    }
    setActiveIdState((current) => {
      const wanted = current ?? readActive(username);
      return list.some((m) => m.id === wanted) ? wanted : list[0]?.id ?? null;
    });
  }, [username]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Otras instancias del hook (barra lateral, página) avisan al crear, renombrar o borrar
  useEffect(() => {
    const onChanged = () => reload();
    const onActiveChanged = (e: Event) => setActiveIdState((e as CustomEvent<number>).detail);
    window.addEventListener(MIXTAPES_CHANGED_EVENT, onChanged);
    window.addEventListener(ACTIVE_CHANGED_EVENT, onActiveChanged);
    return () => {
      window.removeEventListener(MIXTAPES_CHANGED_EVENT, onChanged);
      window.removeEventListener(ACTIVE_CHANGED_EVENT, onActiveChanged);
    };
  }, [reload]);

  const setActiveId = useCallback(
    (id: number) => {
      writeActive(username, id);
      // Todas las instancias del hook (esta incluida) cambian a la vez
      window.dispatchEvent(new CustomEvent(ACTIVE_CHANGED_EVENT, { detail: id }));
    },
    [username]
  );

  return {
    mixtapes,
    activeId,
    active: mixtapes?.find((m) => m.id === activeId) ?? null,
    setActiveId,
    reload,
    isLoading: activeId === undefined,
    isLocal: activeId === null,
  };
}

export default useMixtapes;

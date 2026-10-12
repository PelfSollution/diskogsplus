import { useState, useEffect, useCallback } from "react";
import { getMixtapes, MixtapeInfo } from "@/services/client/mixtape";

const ACTIVE_KEY = "diskogs_active_mixtape_";

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

  const setActiveId = useCallback(
    (id: number) => {
      setActiveIdState(id);
      writeActive(username, id);
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

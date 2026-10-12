import { useState, useEffect, useCallback } from "react";
import { getMixtape } from "../services/client/mixtape";

/**
 * Pistas de una mixtape. mixtapeId: undefined = aún no se sabe cuál (no carga),
 * null = lista local del navegador.
 */
function useGetMixtape(username: string, mixtapeId: number | null | undefined) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!username || mixtapeId === undefined) return;
    try {
      setData(await getMixtape(username, mixtapeId));
      setError(null);
    } catch (err: any) {
      setError(new Error(err.message || "Ocurrió un error al obtener la mixtape"));
    } finally {
      setIsLoading(false);
    }
  }, [username, mixtapeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, isLoading, error, reload };
}

export default useGetMixtape;

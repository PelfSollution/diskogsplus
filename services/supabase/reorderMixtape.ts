import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/**
 * Guarda el orden de las pistas de una mixtape. trackIds debe contener
 * exactamente los ids de sus pistas, en el orden nuevo. Devuelve false si no
 * coinciden (la lista del cliente estaba desfasada). Solo servidor.
 */
const reorderMixtape = async (
  username: string,
  mixtapeId: number,
  trackIds: number[]
): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;

  const { data, error } = await supabase
    .from("mixtape")
    .select("id, position")
    .eq("username", username)
    .eq("mixtape_id", mixtapeId);

  if (error) throw error;

  const current = new Map((data || []).map((t) => [t.id as number, t.position as number | null]));
  if (current.size !== trackIds.length || new Set(trackIds).size !== trackIds.length) return false;
  if (!trackIds.every((id) => current.has(id))) return false;

  // Solo se actualizan las filas que cambian de sitio (las mixtapes son cortas)
  const changed = trackIds
    .map((id, position) => ({ id, position }))
    .filter(({ id, position }) => current.get(id) !== position);

  const results = await Promise.all(
    changed.map(({ id, position }) =>
      supabase.from("mixtape").update({ position }).eq("id", id).eq("mixtape_id", mixtapeId)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;

  return true;
};

export default reorderMixtape;

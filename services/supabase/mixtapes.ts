import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { durationToSeconds } from "../../lib/vinyl";

export type MixtapeInfo = {
  id: number;
  nombre: string;
  created_at: string;
  pistas: number;
  /** Hasta 4 portadas distintas, en el orden de la sesión (mosaico del vinilo) */
  portadas: string[];
  /** Duración de las pistas que la tienen, en segundos */
  segundos: number;
};

export const DEFAULT_MIXTAPE_NAME = "Mi mixtape";

/**
 * Mixtapes del usuario con su número de pistas, portadas y duración. Si no
 * tiene ninguna, crea «Mi mixtape». Solo servidor.
 */
export async function listMixtapes(username: string): Promise<MixtapeInfo[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("mixtapes")
    .select("id, nombre, created_at, mixtape(count)")
    .eq("username", username)
    .order("created_at", { ascending: true });
  if (error) throw error;

  if (!data || data.length === 0) {
    const created = await createMixtape(username, DEFAULT_MIXTAPE_NAME);
    return [created];
  }

  // Portadas y duración de todas las pistas del usuario en una sola consulta
  const { data: tracks, error: tracksError } = await supabase
    .from("mixtape")
    .select("mixtape_id, cover_url, duration")
    .eq("username", username)
    .order("position", { ascending: true, nullsFirst: false });
  if (tracksError) throw tracksError;

  const extras = new Map<number, { portadas: string[]; segundos: number }>();
  for (const t of tracks || []) {
    const entry = extras.get(t.mixtape_id) ?? { portadas: [], segundos: 0 };
    if (t.cover_url && entry.portadas.length < 4 && !entry.portadas.includes(t.cover_url)) {
      entry.portadas.push(t.cover_url);
    }
    entry.segundos += durationToSeconds(t.duration) ?? 0;
    extras.set(t.mixtape_id, entry);
  }

  return data.map((m: any) => ({
    id: m.id,
    nombre: m.nombre,
    created_at: m.created_at,
    pistas: m.mixtape?.[0]?.count ?? 0,
    portadas: extras.get(m.id)?.portadas ?? [],
    segundos: extras.get(m.id)?.segundos ?? 0,
  }));
}

/** Crea una mixtape. Lanza un error con code 23505 si ya existe ese nombre. */
export async function createMixtape(username: string, nombre: string): Promise<MixtapeInfo> {
  const { data, error } = await supabase
    .from("mixtapes")
    .insert({ username, nombre })
    .select("id, nombre, created_at")
    .single();
  if (error) throw error;
  return { ...data, pistas: 0, portadas: [], segundos: 0 };
}

export async function renameMixtape(username: string, id: number, nombre: string) {
  const { error } = await supabase
    .from("mixtapes")
    .update({ nombre })
    .eq("id", id)
    .eq("username", username);
  if (error) throw error;
}

/** Borra la mixtape y sus pistas (on delete cascade). */
export async function deleteMixtape(username: string, id: number) {
  const { error } = await supabase
    .from("mixtapes")
    .delete()
    .eq("id", id)
    .eq("username", username);
  if (error) throw error;
}

/** Comprueba que la mixtape es del usuario antes de tocar sus pistas. */
export async function userOwnsMixtape(username: string, id: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("mixtapes")
    .select("id")
    .eq("id", id)
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Nombre de la mixtape si es del usuario, o null (no existe o es de otro). */
export async function getOwnedMixtapeName(username: string, id: number): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("mixtapes")
    .select("nombre")
    .eq("id", id)
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data?.nombre ?? null;
}

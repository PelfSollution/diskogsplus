import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { saveLocalMixtape, LocalMixtapeTrack } from "../local/mixtapeStorage";

export type Mixtape = LocalMixtapeTrack;

export async function addMixtape(mixtape: Mixtape) {
  // 1. Guardar siempre en almacenamiento local para disponibilidad inmediata
  saveLocalMixtape(mixtape);

  // 2. Si Supabase está configurado, sincronizar con la base de datos
  if (isSupabaseConfigured) {
    try {
      if (mixtape.key === null) mixtape.key = 0;
      if (mixtape.mode === null) mixtape.mode = 0;

      const { data, error } = await supabase
        .from("mixtape")
        .insert([mixtape]);

      if (error) {
        console.warn("[Mixtape] Aviso al sincronizar con Supabase:", error.message);
      }
      return data;
    } catch (error) {
      console.warn("[Mixtape] Excepción al añadir a Supabase:", error);
    }
  }

  return [mixtape];
}

export default addMixtape;
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente de servidor con la clave secreta: se salta RLS. Solo se usa desde
// rutas API; el navegador no tiene acceso directo a Supabase (docs/supabase.md §3).
// Las variables no llevan NEXT_PUBLIC_, así que en el navegador quedan vacías
// e isSupabaseConfigured es false.
const SUPABASE_URL: string =
  process.env.SUPABASE_URL || "";
const SUPABASE_SECRET_KEY: string = process.env.SUPABASE_SECRET_KEY || "";

export const isSupabaseConfigured = Boolean(
  typeof window === "undefined" &&
  SUPABASE_URL &&
  !SUPABASE_URL.includes("placeholder") &&
  SUPABASE_SECRET_KEY &&
  !SUPABASE_SECRET_KEY.includes("placeholder")
);

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? SUPABASE_URL : "https://placeholder.supabase.co",
  isSupabaseConfigured ? SUPABASE_SECRET_KEY : "placeholder-key",
  {
    auth: {
      persistSession: false, // OAuth Discogs
    },
  }
);

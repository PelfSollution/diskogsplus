import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type UserEntry = {
  username: string;
  email?: string;
};

export async function addUser(entry: UserEntry) {
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    const { data, error } = await supabase.from("users").insert([entry]);

    if (error) {
      if (error.message.includes('unique constraint "users_pkey"')) {
        console.warn("El usuario ya existe en Supabase.");
        return null;
      } else if (error.message.includes('unique constraint "users_email_key"')) {
        console.warn("El email ya está registrado con otro usuario.");
        return null;
      } else {
        throw error;
      }
    }

    return data;
  } catch (error: any) {
    console.warn("Aviso añadiendo usuario a Supabase:", error?.message || error);
    return null;
  }
}

export default addUser;

import { supabase } from "@/lib/supabase";

export type UserEntry = {
  username: string;
  email?: string; 
};

export async function addUser(entry: UserEntry) {
  try {
    const { data, error } = await supabase.from("users").insert([entry]);

    if (error) {
      if (error.message.includes('unique constraint "users_pkey"')) {
        throw new Error("El usuario ya existe en la base de datos.");
      } else if (error.message.includes('unique constraint "users_email_key"')) {
        throw new Error("El email ya está registrado con otro usuario.");
      } else {
        throw error;
      }
    }

    return data;
  } catch (error) {
    console.error("Error añadiendo usuario a Supabase:", error);
    return null;
  }
}

export default addUser;

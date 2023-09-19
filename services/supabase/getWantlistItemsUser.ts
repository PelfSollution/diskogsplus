import { supabase } from "@/lib/supabase";

export type WantlistEntry = {
  username: string;
  disco_id: number;
  notes?: string;
  rating?: number;
  artista: string;
  album: string;
  image_url: string;
};

export async function getWantlistItemsUser(
  username: string
): Promise<WantlistEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from("wantlist")
      .select("*")
      .eq("username", username);

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return data as WantlistEntry[];
  } catch (error) {
    console.error(
      "Error obteniendo las entradas de la wantlist en Supabase para el usuario:",
      username,
      error
    );
    return null;
  }
}

export default getWantlistItemsUser;

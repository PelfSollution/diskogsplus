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

export async function addWantlistEntry(entry: WantlistEntry) {
  try {
    const { data, error } = await supabase.from("wantlist").insert([entry]);

    if (error) {
      if (
        error.message.includes('unique constraint "unique_username_disco_id"')
      ) {
        throw new Error("Ya has añadido este disco a tu wantlist.");
      } else {
        throw error;
      }
    }

    return data;
  } catch (error) {
    console.error("Error añadiendo entrada a la wantlist en Supabase:", error);
    return null;
  }
}

export default addWantlistEntry;

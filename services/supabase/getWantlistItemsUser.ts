import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
  if (!isSupabaseConfigured || !username) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("wantlist")
      .select("*")
      .eq("username", username);

    if (error) {
      console.warn("Aviso obteniendo wantlist:", error.message);
      return [];
    }

    if (!data) {
      return [];
    }

    return data as WantlistEntry[];
  } catch (error: any) {
    console.warn("Aviso obteniendo wantlist:", error?.message || error);
    return [];
  }
}

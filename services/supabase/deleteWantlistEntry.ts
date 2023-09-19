import { supabase } from "@/lib/supabase";

export type WantlistEntry = {
  username: string;
  disco_id: number;
  notes?: string;
  rating?: number;
};

export async function deleteWantlistEntry(username: string, disco_id: number) {
  try {
    const { data, error } = await supabase.from("wantlist").delete().match({
      username: username,
      disco_id: disco_id,
    });

    if (error) {
      console.error(
        "Error eliminando entrada de la wantlist en Supabase:",
        error
      );
      return {
        data: null,
        error:
          "Error al eliminar la entrada de la wantlist en Supabase: " +
          error.message,
      };
    }

    return { data: data, error: null };
  } catch (error: any) {
    console.error("Error inesperado en deleteWantlistEntry:", error);
    return {
      data: null,
      error:
        "Error inesperado al intentar eliminar una entrada de la wantlist: " +
        error.message,
    };
  }
}

export default deleteWantlistEntry;

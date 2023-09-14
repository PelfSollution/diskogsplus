import { supabase } from "../../lib/supabase";

type UpdateFields = {
  response?: string;
  // Puedes añadir otros campos que quieras actualizar aquí.
};

export async function updateChatLog(id: number, updateFields: UpdateFields) {
  try {
    const { data, error } = await supabase
      .from('chat_logs')
      .update(updateFields)
      .eq('id', id);  // Aquí se especifica el criterio para encontrar la entrada correcta.

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error actualizando entrada de chat:", error);
    return null;
  }
}

import { supabase } from "../../lib/supabase";

export async function deleteChatLog(id: number) {
  try {
    const { data, error } = await supabase
      .from('chat_logs')
      .delete()
      .eq('id', id);  // Esto selecciona el registro con el ID correspondiente para borrarlo.

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error eliminando entrada de chat:", error);
    return null;
  }
}

export default deleteChatLog;

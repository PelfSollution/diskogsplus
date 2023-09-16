import { supabase } from "../../lib/supabase";

export interface ChatLog {
  artista: string;
  album: string;
  disco_id: number;
}

export async function getChatLogsUser(username: string): Promise<ChatLog[]> {
  try {
    const { data, error } = await supabase
      .from("chat_logs")
      .select("artista, album, disco_id")
      .eq("username", username);

    if (error) {
      throw error;
    }

    const uniqueRecords = Array.from(
      new Set(data.map((record) => JSON.stringify(record)))
    ).map((recordString) => JSON.parse(recordString));

    return uniqueRecords;
  } catch (error) {
    console.error("Error obteniendo logs de chat:", error);
    return [];
  }
}

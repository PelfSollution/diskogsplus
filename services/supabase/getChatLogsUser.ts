import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export interface ChatLog {
  artista: string;
  album: string;
  disco_id: number;
}

export async function getChatLogsUser(username: string): Promise<ChatLog[]> {
  if (!isSupabaseConfigured || !username) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("chat_logs")
      .select("artista, album, disco_id")
      .eq("username", username);

    if (error) {
      console.warn("Aviso obteniendo logs de chat:", error.message);
      return [];
    }

    if (!data) return [];

    const uniqueRecords = Array.from(
      new Set(data.map((record) => JSON.stringify(record)))
    ).map((recordString) => JSON.parse(recordString));

    return uniqueRecords;
  } catch (error: any) {
    console.warn("Aviso obteniendo logs de chat:", error?.message || error);
    return [];
  }
}

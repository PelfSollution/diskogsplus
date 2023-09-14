import { supabase } from "../../lib/supabase";


type NewChatLog = {
    username?: string;
    prompt: string;
    response?: string;
    artista?: string; 
    album?: string;   
};

type RetrievedChatLog = NewChatLog & {
    id: number;  // Asegura que los registros recuperados tengan un id.
};

export async function getLastChatLogForUser(username: string): Promise<RetrievedChatLog | null> {
    try {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .eq('username', username)
        .order('id', { ascending: false })  // Ordena por id descendente para obtener el último registro
        .limit(1);  // Solo quiere obtener un registro
  
      if (error) {
        throw error;
      }
  
      return data ? data[0] : null;
    } catch (error) {
      console.error("Error obteniendo el último registro de chat:", error);
      return null;
    }
  }
  
import { supabase } from "../../lib/supabase";

type ChatLog = {
  username?: string;
  prompt: string;
  response?: string;
  artista?: string; 
  album?: string;   
};



export async function addChatLog(chatLog: ChatLog) {
  try {
    const { data, error } = await supabase
      .from('chat_logs')
      .insert([chatLog]);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error añadiendo entrada de chat:", error);
    return null;
  }
}

export default addChatLog;

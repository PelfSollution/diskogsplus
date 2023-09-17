import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { addChatLog } from "../../../services/supabase/addChatLogs";
import { updateChatLog } from "../../../services/supabase/updateChatLogs";
import { getLastChatLogForUser } from "../../../services/supabase/getLastChatLogForUser";


export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {

  const userMessages = await req.json();
  const { artista, album, username, disco_id } = userMessages;
  const systemMessage = {
    role: "system",
    content: `Eres un asistente especializado en música y discos. Debes responder preguntas exclusivamente relacionadas con el disco "${album}" del artista "${artista}". No te desvíes de ese tema ni proporciones información no relacionada con ese disco o artista.`,
  };

  const messages = [systemMessage, ...userMessages.messages];

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: messages,
  });

  const stream = OpenAIStream(response, {
    onStart: async () => {
      const systemPrompt = `Eres un asistente especializado en música y discos. Debes responder preguntas exclusivamente relacionadas con el disco "${album}" del artista "${artista}". No te desvíes de ese tema ni proporciones información no relacionada con ese disco o artista.`;

      await addChatLog({
        username: username,
        prompt: messages[messages.length - 1].content,
        response: "",
        artista: artista,
        album: album,
        disco_id: disco_id,
      });
    },
    onToken: async (token: string) => {
 
    },
    onCompletion: async (completion: string) => {
      const lastChatLog = await getLastChatLogForUser(username);
      if (lastChatLog && lastChatLog.id) {
        await updateChatLog(lastChatLog.id, {
          response: completion,
        });
      }
    },
  });

  return new StreamingTextResponse(stream);
}

import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { addChatLog } from  '../../../services/supabase/addChatLogs';
import { updateChatLog } from  '../../../services/supabase/updateChatLogs';
import { getLastChatLogForUser } from  '../../../services/supabase/getLastChatLogForUser';
 
// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = 'edge';


 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
 
export async function POST(req: Request) {
    // Extract the `messages` from the body of the request
    const userMessages = await req.json();

// Asumimos que estás pasando artista, album y username en el body de tu request
const { artista, album, username } = userMessages;
    // Define a system message to guide the conversation
    const systemMessage = {
      role: "system",
      content: `Eres un asistente especializado en música y discos. Debes responder preguntas exclusivamente relacionadas con el disco "${album}" del artista "${artista}". No te desvíes de ese tema ni proporciones información no relacionada con ese disco o artista.`
    };
    
    // Merge system message with user messages
    const messages = [systemMessage, ...userMessages.messages];
   
 
  // Request the OpenAI API for the response based on the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: messages
    
  });


 
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    onStart: async () => {
      // El prompt es el mensaje original que guía la conversación.
      const systemPrompt = `Eres un asistente especializado en música y discos. Debes responder preguntas exclusivamente relacionadas con el disco "${album}" del artista "${artista}". No te desvíes de ese tema ni proporciones información no relacionada con ese disco o artista.`;

      // Guardar el prompt inicial en la base de datos
      await addChatLog({
        username: username,
        prompt: messages[messages.length - 1].content,
        response: "",
        artista: artista,
        album: album
      });
      
    },
    onToken: async (token: string) => {
      console.log(token);
    },
    onCompletion: async (completion: string) => {
      const lastChatLog = await getLastChatLogForUser(username);
      if (lastChatLog && lastChatLog.id) {
        await updateChatLog(lastChatLog.id, {
          response: completion
        });
      }
    },
});

 
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
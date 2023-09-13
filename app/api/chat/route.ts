import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
 
// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = 'edge';
 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
 
export async function POST(req: Request) {
    // Extract the `messages` from the body of the request
    const userMessages = await req.json();

    let artista = "";
    let album = "";

    // Extrae el artista y el álbum del mensaje del sistema
    for (let msg of userMessages.messages) {
        if (msg.role === "system") {
            const matchArtista = msg.content.match(/artista "([^"]+)"/);
            const matchAlbum = msg.content.match(/disco "([^"]+)"/);
            
            if (matchArtista) artista = matchArtista[1];
            if (matchAlbum) album = matchAlbum[1];
        }
    }
  
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
  const stream = OpenAIStream(response);
 
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
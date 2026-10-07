import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { addChatLog } from "../../../services/supabase/addChatLogs";
import { updateChatLog } from "../../../services/supabase/updateChatLogs";
import { getLastChatLogForUser } from "../../../services/supabase/getLastChatLogForUser";
import { getUserApiKey } from "../../../services/supabase/getUserApiKey";
import {
  MUSIC_AGENT_FUNCTIONS,
  buildSystemPrompt,
  executeMusicAgentTool,
} from "../../../services/agent/musicAgent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const userMessages = await req.json();
    const { artista, album, username, disco_id, messages: chatHistory = [] } = userMessages;

    // Obtener la clave API del usuario o de las variables de entorno (Google AI Studio o OpenAI)
    const userApiKey = await getUserApiKey(username);
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Detectar si usamos Google AI Studio (Gemini) o OpenAI
    const isUsingGemini = Boolean(geminiApiKey || (userApiKey && userApiKey.startsWith("AIza")));
    const apiKeyToUse = isUsingGemini
      ? (geminiApiKey || userApiKey)
      : (userApiKey || process.env.OPENAI_API_KEY);

    if (!apiKeyToUse) {
      return new Response(
        JSON.stringify({
          error:
            "No se ha configurado ninguna clave API. Agrega GEMINI_API_KEY (de aistudio.google.com) o OPENAI_API_KEY en tu .env.local.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const baseURL = isUsingGemini
      ? "https://generativelanguage.googleapis.com/v1beta/openai/"
      : undefined;

    const preferredModel = isUsingGemini
      ? (process.env.GEMINI_MODEL || "gemini-2.5-flash")
      : (process.env.OPENAI_MODEL || "gpt-4o-mini");

    const openai = new OpenAI({
      apiKey: apiKeyToUse,
      baseURL,
    });

    // 1. Construir el prompt de sistema del Agente Musical
    const systemPromptContent = buildSystemPrompt({
      artist: artista,
      album: album,
      discoId: disco_id,
      username: username,
    });

    const conversationMessages: any[] = [
      { role: "system", content: systemPromptContent },
      ...chatHistory.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let currentMessages = [...conversationMessages];

    // 2. Loop de Agente: Comprobar si el modelo solicita invocar funciones/herramientas
    try {
      const functionCheckResponse = await openai.chat.completions.create({
        model: preferredModel,
        messages: currentMessages,
        functions: MUSIC_AGENT_FUNCTIONS,
        function_call: "auto",
      });

      const choice = functionCheckResponse.choices[0];
      if (choice?.message?.function_call) {
        const fnCall = choice.message.function_call;
        let parsedArgs: any = {};
        try {
          parsedArgs = JSON.parse(fnCall.arguments);
        } catch {
          parsedArgs = {};
        }

        const toolOutput = await executeMusicAgentTool(
          fnCall.name,
          parsedArgs,
          { username, discoId: disco_id, artist: artista, album: album }
        );

        // Añadir el mensaje de llamada del asistente y la respuesta de la función
        currentMessages.push({
          role: "assistant",
          content: null,
          function_call: fnCall,
        });

        currentMessages.push({
          role: "function",
          name: fnCall.name,
          content: JSON.stringify(toolOutput),
        });
      }
    } catch (agentError: any) {
      console.warn(
        "Aviso en ejecución de herramientas del agente (continuando con flujo estándar):",
        agentError?.message
      );
    }

    // 3. Transmitir en streaming la respuesta final fundada en datos reales
    const streamResponse = await openai.chat.completions.create({
      model: preferredModel,
      messages: currentMessages,
      stream: true,
    });

    const stream = OpenAIStream(streamResponse as any, {
      onStart: async () => {
        try {
          const lastUserMsg = chatHistory[chatHistory.length - 1]?.content || "";
          await addChatLog({
            username: username,
            prompt: lastUserMsg,
            response: "",
            artista: artista,
            album: album,
            disco_id: disco_id ? Number(disco_id) : undefined,
          });
        } catch (e: any) {
          console.warn("[ChatLog] Registro inicial de chat omitido:", e?.message);
        }
      },
      onCompletion: async (completion: string) => {
        try {
          const lastChatLog = await getLastChatLogForUser(username);
          if (lastChatLog && lastChatLog.id) {
            await updateChatLog(lastChatLog.id, {
              response: completion,
            });
          }
        } catch (e: any) {
          console.warn("[ChatLog] Actualización de chat omitida:", e?.message);
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (err: any) {
    console.error("Error en endpoint de agente de chat:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno procesando la consulta del agente musical.",
        detalles: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

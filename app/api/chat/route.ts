import OpenAI from "openai";
import { NextRequest } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { getSessionUserFromCookie } from "../../../lib/session";
import { rateLimit } from "../../../lib/rateLimit";
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

const MAX_HISTORY_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;

function jsonError(status: number, error: string, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function POST(req: NextRequest) {
  try {
    // El usuario sale siempre de la sesión, nunca del body
    const username = getSessionUserFromCookie(req.cookies.get("usernameCipher")?.value);
    if (!username) {
      return jsonError(401, "No autenticado. Inicia sesión de nuevo.");
    }

    const limit = rateLimit(`chat:${username}`, 20, 60_000);
    if (!limit.ok) {
      return jsonError(429, "Demasiadas peticiones. Espera un momento.", {
        "Retry-After": String(limit.retryAfterSeconds),
      });
    }

    const userMessages = await req.json();
    const { artista, album, disco_id, messages: rawHistory = [] } = userMessages;

    // Solo se aceptan mensajes user/assistant del cliente: el prompt de sistema lo pone el servidor
    const chatHistory: { role: "user" | "assistant"; content: string }[] = (
      Array.isArray(rawHistory) ? rawHistory : []
    )
      .filter(
        (m: any) =>
          (m?.role === "user" || m?.role === "assistant") &&
          typeof m?.content === "string"
      )
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m: any) => ({
        role: m.role,
        content: m.content.slice(0, MAX_MESSAGE_CHARS),
      }));

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
      ...chatHistory,
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
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

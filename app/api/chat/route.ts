import { NextRequest } from "next/server";
import {
  streamText,
  convertToModelMessages,
  isStepCount,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { addChatLog } from "../../../services/supabase/addChatLogs";
import { updateChatLog } from "../../../services/supabase/updateChatLogs";
import { getLastChatLogForUser } from "../../../services/supabase/getLastChatLogForUser";
import { getOwnedMixtapeName } from "../../../services/supabase/mixtapes";
import { getAIClient } from "../../../lib/aiClient";
import { getSessionUserFromCookie } from "../../../lib/session";
import { rateLimit } from "../../../lib/rateLimit";
import {
  buildMusicAgentTools,
  buildSystemPrompt,
} from "../../../services/agent/musicAgent";

export const runtime = "nodejs";

const MAX_HISTORY_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;
// Pasos del agente: llamadas a herramientas + respuesta final
const MAX_AGENT_STEPS = 5;

function jsonError(status: number, error: string, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Solo se aceptan mensajes user/assistant con partes de texto: el prompt de
 * sistema lo pone el servidor y el historial de herramientas no se reenvía.
 */
function sanitizeMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m: any) => m?.role === "user" || m?.role === "assistant")
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m: any, index: number) => ({
      id: typeof m.id === "string" && m.id ? m.id : `msg-${index}`,
      role: m.role as "user" | "assistant",
      parts: (Array.isArray(m.parts) ? m.parts : [])
        .filter((p: any) => p?.type === "text" && typeof p.text === "string")
        .map((p: any) => ({ type: "text" as const, text: p.text.slice(0, MAX_MESSAGE_CHARS) })),
    }))
    .filter((m) => m.parts.length > 0);
}

function lastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (
    last?.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim() || ""
  );
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

    const body = await req.json();
    const { artista, album, disco_id } = body ?? {};
    const messages = sanitizeMessages(body?.messages);

    if (messages.length === 0) {
      return jsonError(400, "No hay mensajes que procesar.");
    }

    // Google AI Studio (Gemini) u OpenAI, con la clave del entorno o del usuario
    const ai = await getAIClient(username);
    if (!ai) {
      return jsonError(
        400,
        "No se ha configurado ninguna clave API. Agrega GEMINI_API_KEY (de aistudio.google.com) o OPENAI_API_KEY en tu .env.local."
      );
    }

    // Mixtape del chat: solo si es del usuario; si no, las tools leen todas
    let mixtapeId: number | undefined;
    let mixtapeName: string | undefined;
    const requestedMixtapeId = Number(body?.mixtape_id);
    if (Number.isInteger(requestedMixtapeId)) {
      try {
        const nombre = await getOwnedMixtapeName(username, requestedMixtapeId);
        if (nombre) {
          mixtapeId = requestedMixtapeId;
          mixtapeName = nombre;
        }
      } catch (e: any) {
        console.warn("[Chat] No se pudo comprobar la mixtape:", e?.message);
      }
    }

    const context = { username, discoId: disco_id, artist: artista, album, mixtapeId, mixtapeName };
    const prompt = lastUserText(messages);

    // Registro del chat (si Supabase no está configurado, se omite)
    try {
      await addChatLog({
        username,
        prompt,
        response: "",
        artista,
        album,
        disco_id: disco_id ? Number(disco_id) : undefined,
      });
    } catch (e: any) {
      console.warn("[ChatLog] Registro inicial de chat omitido:", e?.message);
    }

    const result = streamText({
      model: ai.model,
      instructions: buildSystemPrompt(context),
      messages: await convertToModelMessages(messages),
      tools: buildMusicAgentTools(context),
      stopWhen: isStepCount(MAX_AGENT_STEPS),
      onEnd: async ({ text }) => {
        try {
          const lastChatLog = await getLastChatLogForUser(username);
          if (lastChatLog && lastChatLog.id) {
            await updateChatLog(lastChatLog.id, { response: text });
          }
        } catch (e: any) {
          console.warn("[ChatLog] Actualización de chat omitida:", e?.message);
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) => {
          console.error("Error en el stream del agente de chat:", error);
          return "Error procesando la consulta del agente musical.";
        },
      }),
    });
  } catch (err: any) {
    console.error("Error en endpoint de agente de chat:", err);
    return jsonError(500, "Error interno procesando la consulta del agente musical.");
  }
}

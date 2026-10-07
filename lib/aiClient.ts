import type { LanguageModel } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { getUserApiKey } from "../services/supabase/getUserApiKey";

export interface AIClientConfig {
  model: LanguageModel;
  modelId: string;
  isGemini: boolean;
  apiKey: string;
}

/**
 * Elige proveedor y clave de IA (AI SDK v7).
 * Orden: GEMINI_API_KEY → clave guardada por el usuario → OPENAI_API_KEY.
 * Las claves que empiezan por "AIza" son de Google AI Studio (Gemini).
 */
export async function getAIClient(username?: string): Promise<AIClientConfig | null> {
  const userApiKey = username ? await getUserApiKey(username) : null;
  const geminiEnvKey = process.env.GEMINI_API_KEY?.trim();
  const openaiEnvKey = process.env.OPENAI_API_KEY?.trim();

  // Determinar si usamos Google AI Studio (Gemini) o OpenAI
  const isGemini = Boolean(
    geminiEnvKey ||
    (userApiKey && userApiKey.startsWith("AIza")) ||
    (openaiEnvKey && openaiEnvKey.startsWith("AIza"))
  );

  const apiKeyToUse = isGemini
    ? (geminiEnvKey || (userApiKey && userApiKey.startsWith("AIza") ? userApiKey : "") || openaiEnvKey || "")
    : (userApiKey || openaiEnvKey || "");

  if (!apiKeyToUse) {
    return null;
  }

  if (isGemini) {
    const modelId = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    const google = createGoogle({ apiKey: apiKeyToUse });
    return { model: google(modelId), modelId, isGemini, apiKey: apiKeyToUse };
  }

  const modelId = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const openai = createOpenAI({ apiKey: apiKeyToUse });
  return { model: openai(modelId), modelId, isGemini, apiKey: apiKeyToUse };
}

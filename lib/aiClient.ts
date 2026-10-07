import OpenAI from "openai";
import { getUserApiKey } from "../services/supabase/getUserApiKey";

export interface AIClientConfig {
  client: OpenAI;
  model: string;
  isGemini: boolean;
  apiKey: string;
}

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

  const baseURL = isGemini
    ? "https://generativelanguage.googleapis.com/v1beta/openai/"
    : undefined;

  const model = isGemini
    ? (process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash")
    : (process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini");

  const client = new OpenAI({
    apiKey: apiKeyToUse,
    baseURL,
  });

  return { client, model, isGemini, apiKey: apiKeyToUse };
}

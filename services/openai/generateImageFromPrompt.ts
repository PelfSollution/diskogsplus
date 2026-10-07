import { generateImage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getUserApiKey } from "../supabase/getUserApiKey";

/**
 * Genera una portada conceptual con IA para vinilos musicales.
 * Prioridad de motores de IA:
 * 1. Google Imagen 3 (si hay GEMINI_API_KEY)
 * 2. OpenAI DALL-E (si hay clave OpenAI con formato sk-...)
 * 3. Flux / SDXL Generator (vía Pollinations AI, libre y sin cuotas)
 */
export async function generateImageFromPrompt(
  prompt?: string,
  username?: string,
  artistName?: string,
  title?: string
): Promise<string> {
  const safePrompt =
    prompt ||
    `Vinyl album cover art for "${title || "Music Album"}" by "${artistName || "Artist"}". ` +
    `Stunning artistic album sleeve, rich colors, intricate details, highly atmospheric vinyl aesthetic, 8k resolution.`;

  // 1. Verificar claves de usuario y variables de entorno
  let userApiKey: string | null = null;
  if (username) {
    userApiKey = await getUserApiKey(username);
  }

  const geminiEnvKey = process.env.GEMINI_API_KEY?.trim();
  const openaiEnvKey = process.env.OPENAI_API_KEY?.trim();

  const geminiKey =
    geminiEnvKey ||
    (userApiKey && userApiKey.startsWith("AIza") ? userApiKey : null) ||
    (openaiEnvKey && openaiEnvKey.startsWith("AIza") ? openaiEnvKey : null);

  const openaiKey =
    (userApiKey && userApiKey.startsWith("sk-") ? userApiKey : null) ||
    (openaiEnvKey && openaiEnvKey.startsWith("sk-") ? openaiEnvKey : null);

  // 2. Intentar con Google Imagen 3 si disponemos de Gemini API Key
  if (geminiKey) {
    try {
      console.log("[ImageGen] Intentando generar portada con Google Imagen 3...");
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`;

      const res = await fetch(imagenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [
            {
              prompt: `Artistic vinyl LP record cover art for ${title || "Album"} by ${artistName || "Artist"}. ${safePrompt}`,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            outputMimeType: "image/jpeg",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const base64Bytes = data?.predictions?.[0]?.bytesBase64Encoded;
        if (base64Bytes) {
          console.log("[ImageGen] ¡Portada generada con éxito con Google Imagen 3!");
          return `data:image/jpeg;base64,${base64Bytes}`;
        }
      } else {
        const errText = await res.text();
        console.warn("[ImageGen] Google Imagen 3 devolvió status:", res.status, errText);
      }
    } catch (err: any) {
      console.warn("[ImageGen] Aviso con Google Imagen 3:", err?.message);
    }
  }

  // 3. Intentar con OpenAI DALL-E si hay clave sk-...
  if (openaiKey) {
    try {
      console.log("[ImageGen] Intentando generar portada con OpenAI DALL-E...");
      const openai = createOpenAI({ apiKey: openaiKey });
      // dall-e-2: el modelo que usaba por defecto el SDK `openai` anterior
      const { image } = await generateImage({
        model: openai.image("dall-e-2"),
        prompt: safePrompt.slice(0, 1000),
        n: 1,
        size: "1024x1024",
      });

      if (image?.base64) {
        console.log("[ImageGen] ¡Portada generada con éxito con DALL-E!");
        return `data:${image.mediaType || "image/png"};base64,${image.base64}`;
      }
    } catch (err: any) {
      console.warn("[ImageGen] Aviso con OpenAI DALL-E:", err?.message);
    }
  }

  // 4. Fallback de alta fidelidad con Flux / SDXL (Pollinations AI)
  // Libre, instantáneo, sin cuotas y con una estética artística para portadas excelente
  console.log("[ImageGen] Generando portada de vinilo con motor Flux AI (Pollinations)...");
  const randomSeed = Math.floor(Math.random() * 10000000);
  const cleanDescription = encodeURIComponent(
    `Vintage vinyl album cover sleeve for "${title || "Music"}" by "${artistName || "Artist"}". ` +
    `${safePrompt}, album cover typography, hyper-detailed retro-futuristic cover art`
  );

  const fluxUrl = `https://image.pollinations.ai/prompt/${cleanDescription}?width=1024&height=1024&seed=${randomSeed}&nologo=true&model=flux`;
  return fluxUrl;
}

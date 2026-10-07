import { generateText } from "ai";
import { getAIClient } from "@/lib/aiClient";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getArtistInfoFromSupabase } from "../supabase/getArtistInfoSupabase";
import { saveArtistInfotoSupabase } from "../supabase/saveArtistInfotoSupabase";

export async function enrichArtistInfoWithChatGPT(
  artistName: string,
  albumName: string,
  discoId: string | number,
  username: string
): Promise<string> {
  const discoIdStr = discoId ? discoId.toString() : "";

  // 1. Si Supabase está configurado, intentar obtener la información enriquecida previa de caché
  if (isSupabaseConfigured && discoIdStr) {
    try {
      const cachedInfo = await getArtistInfoFromSupabase(discoIdStr);
      if (cachedInfo && cachedInfo.trim().length > 20) {
        return cachedInfo;
      }
    } catch (dbErr) {
      console.warn("[EnrichInfo] Supabase cache read warning:", dbErr);
    }
  }

  // 2. Obtener cliente de IA (Google AI Studio Gemini o OpenAI)
  const ai = await getAIClient(username);

  if (!ai) {
    return (
      `No se ha configurado ninguna clave de IA. Por favor, añade tu GEMINI_API_KEY ` +
      `(obtenida gratuitamente en https://aistudio.google.com/) en el archivo .env.local para activar el análisis musical.`
    );
  }

  // 3. Generar análisis contextual con IA
  try {
    const prompt =
      `Proporciona un análisis enriquecido y contexto histórico sobre el álbum "${albumName || "Desconocido"}" ` +
      `del artista o banda "${artistName || "Desconocido"}".\n\n` +
      `Estructura la respuesta de forma clara y amena cubriendo:\n` +
      `1. Contexto de la época y momento artístico del creador.\n` +
      `2. Estilo sonoro, producción e influencias musicales clave.\n` +
      `3. Repercusión cultural y por qué es una pieza valiosa para coleccionistas de vinilo.`;

    const { text } = await generateText({
      model: ai.model,
      instructions:
        "Eres un musicólogo e historiador musical experto. Proporcionas información detallada, " +
        "precisa y apasionada sobre la historia de la música y lanzamientos discográficos en vinilo. " +
        "Responde siempre en español con tono divulgativo de alta calidad.",
      prompt,
      maxOutputTokens: 850,
      temperature: 0.7,
    });

    const enrichedInfo =
      text.trim() || "No se pudo generar el análisis detallado para este álbum.";

    // 4. Guardar en Supabase para el futuro si la base de datos está disponible
    if (isSupabaseConfigured && discoIdStr) {
      try {
        await saveArtistInfotoSupabase(artistName, albumName, discoIdStr, enrichedInfo);
      } catch (saveErr) {
        console.warn("[EnrichInfo] No se pudo persistir en Supabase:", saveErr);
      }
    }

    return enrichedInfo;
  } catch (error: any) {
    console.error("[EnrichInfo] Error invocando modelo de IA:", error);
    return `Error al contactar con el servicio de IA: ${error?.message || "Inténtalo de nuevo en unos momentos."}`;
  }
}

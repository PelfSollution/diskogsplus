import OpenAI from "openai";

import { getArtistInfoFromSupabase } from "../supabase/getArtistInfoSupabase";

import { saveArtistInfotoSupabase } from "../supabase/saveArtistInfotoSupabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function mockEnrichArtistInfoWithChatGPT(artistName: string): Promise<string> {
  return new Promise((resolve) => {
    resolve(`Esta es una respuesta simulada para el artista ${artistName}.`);
  });
}

export async function enrichArtistInfoWithChatGPT(
  artistName: string,

  albumName: string,

  discoId: string
): Promise<string> {
  // Intenta obtener la información enriquecida de Supabase primero

  console.log("[Supabase] Intentando obtener información enriquecida desde Supabase...");
  let enrichedInfo: string | null = await getArtistInfoFromSupabase(discoId);
  console.log("[Supabase] Respuesta obtenida.");

  // Si ya tenemos la información enriquecida en Supabase, la retornamos

  if (enrichedInfo) {
    return enrichedInfo;
  }

  // Si estamos en desarrollo, devolvemos un mock

  if (process.env.NODE_ENTORNO === "development") {
    enrichedInfo = await mockEnrichArtistInfoWithChatGPT(artistName);

    return enrichedInfo;
  }

  // Si no, intentamos obtener la información de OpenAI
  console.log("[OpenAI] Intentando obtener información desde OpenAI...");
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",

      messages: [
        {
          role: "user",

          content: `Proporciona información adicional sobre el artista ${artistName}`,
        },
      ],

      max_tokens: 400,

      temperature: 1,

      stop: ["\\n"],
    });

    enrichedInfo =
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message &&
      response.choices[0].message.content
        ? response.choices[0].message.content.trim()
        : "No se pudo obtener información adicional del artista.";

    // Guardamos la información enriquecida en Supabase para referencias futuras

    await saveArtistInfotoSupabase(
      artistName,
      albumName,
      discoId,
      enrichedInfo
    );
    console.log("[OpenAI] Información obtenida con éxito.");
    return enrichedInfo;
  } catch (error) {
    console.error("Error en OpenAI:", error);

    return "Error al obtener información adicional del artista.";
  }
}

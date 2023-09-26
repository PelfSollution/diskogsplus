import OpenAI from "openai";

import { getArtistInfoFromSupabase } from "../supabase/getArtistInfoSupabase";

import { saveArtistInfotoSupabase } from "../supabase/saveArtistInfotoSupabase";

async function getDecryptedUserApiKey(username: string): Promise<string | null> {
  try {
    const res = await fetch('/api/getApiKey', {
      method: 'POST',
      body: JSON.stringify({ username }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    return data.apiKey || null;
  } catch (err) {
    return null;
  }
}

function mockEnrichArtistInfoWithChatGPT(artistName: string): Promise<string> {
  return new Promise((resolve) => {
    resolve(`Esta es una respuesta simulada para el artista ${artistName}.`);
  });
}

export async function enrichArtistInfoWithChatGPT(
  artistName: string,

  albumName: string,

  discoId: string,
  username: string
): Promise<string> {

   // Intentar obtener la API key del usuario de la base de datos
   const userApiKey = await getDecryptedUserApiKey(username);
  
   // Elegir qué clave usar
   const apiKeyToUse = userApiKey || process.env.OPENAI_API_KEY!;
   
   // Instanciar OpenAI con la clave elegida
   const openai = new OpenAI({
     apiKey: apiKeyToUse,
   });



  // Intenta obtener la información enriquecida de Supabase primero

  let enrichedInfo: string | null = await getArtistInfoFromSupabase(discoId);


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

      max_tokens: 500,

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

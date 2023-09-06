import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function mockEnrichArtistInfoWithChatGPT(artistName: string): Promise<string> {
  return new Promise((resolve) => {
    resolve(`Esta es una respuesta simulada para el artista ${artistName}.`);
  });
}

export async function enrichArtistInfoWithChatGPT(
  artistName: string
): Promise<string> {
  if (process.env.NODE_ENTORNO === "development") {
    return mockEnrichArtistInfoWithChatGPT(artistName);
  }
  try {
    const completion = await openai.completions.create({
      model: "text-davinci-003",
      prompt: `Proporciona información adicional sobre el artista ${artistName}`,
      max_tokens: 300,
      temperature: 0,
    });

    return completion.choices && completion.choices.length > 0
      ? completion.choices[0].text.trim()
      : "No se pudo obtener información adicional del artista.";
  } catch (error) {
    console.error("Error en OpenAI:", error);
    return "Error al obtener información adicional del artista.";
  }
}

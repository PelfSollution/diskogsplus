import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function generateImageFromPrompt(
  prompt?: string
): Promise<string> {
  if (!prompt) {
    return "/no-portada.gif";
  }

  try {
    const image = await openai.images.generate({ prompt,
      size: "512x512" } as any);

    return image.data && image.data.length > 0 && image.data[0].url
      ? image.data[0].url
      : "/no-portada.gif";
  } catch (error) {
    console.error("Error generando imagen:", error);
    return "/no-portada.gif";
  }
}

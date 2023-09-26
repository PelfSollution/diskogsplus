import OpenAI from "openai";

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

export async function generateImageFromPrompt(
  prompt?: string,
  username?: string 
): Promise<string> {

    // Intentar obtener la API key del usuario de la base de datos
    let userApiKey;
    if (username) {
      userApiKey = await getDecryptedUserApiKey(username);
    }
  
    // Elegir qué clave usar
    const apiKeyToUse = userApiKey || process.env.OPENAI_API_KEY!;
    
    // Instanciar OpenAI con la clave elegida
    const openai = new OpenAI({
      apiKey: apiKeyToUse,
    });


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

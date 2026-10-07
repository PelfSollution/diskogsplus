import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { generateImageFromPrompt } from "../openai/generateImageFromPrompt";
import { sanitizeFileName } from "../../lib/stringUtils";

const PROMPTS = [
  "Surrealistic digital vinyl sleeve painting for ${title} by ${artistName}. Cosmic typography, vibrant neon palette, atmospheric lighting, detailed vinyl artwork.",
  "Vintage 1970s analog vinyl LP cover for ${artistName} - ${title}. Retro aesthetic, textured paper sleeve, warm tones, cinematic analog photography.",
  "Avant-garde modern vinyl album artwork for ${title} by ${artistName}. Bold geometric shapes, minimalist typography, artistic museum quality.",
  "Psychedelic dreamscape vinyl album cover for ${artistName} - ${title}. Rich psychedelic oil painting, intricate motifs, ethereal lighting, collector vinyl edition.",
];

async function uploadImageToStorage(
  imageData: Buffer,
  filePath: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase.storage
      .from("generated_images")
      .upload(filePath, imageData, { upsert: true, contentType: "image/jpeg" });

    if (error) {
      console.warn("[Storage] No se pudo subir imagen a Supabase Storage:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("generated_images")
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err: any) {
    console.warn("[Storage] Excepción al interactuar con Supabase Storage:", err?.message);
    return null;
  }
}

async function saveImageMetadata(
  artistName: string,
  imageUrl: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase
      .from("generated_images_metadata")
      .insert([{ artista: artistName, image_url: imageUrl }]);

    if (error) {
      console.warn("[Storage] Error al guardar metadatos de la imagen:", error.message);
    }
  } catch (err) {
    // Silencioso si la tabla no existe
  }
}

export async function fetchOrGenerateImage(
  artistName: string,
  coverType: "front" | "back",
  title: string,
  username: string
): Promise<string | null> {
  const safeArtist = artistName || "Artista";
  const safeTitle = title || "Álbum";
  const sanitizedArtistName = sanitizeFileName(safeArtist);
  const filePath = `uploads/${sanitizedArtistName}_${coverType}.jpg`;

  // 1. Si Supabase Storage está configurado, comprobar si ya existe en storage
  if (isSupabaseConfigured) {
    try {
      const { data: publicUrlData } = supabase.storage
        .from("generated_images")
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        const checkRes = await fetch(publicUrlData.publicUrl, { method: "HEAD" });
        if (checkRes.ok) {
          console.log(`[Storage] Imagen previa encontrada en Storage: ${publicUrlData.publicUrl}`);
          return publicUrlData.publicUrl;
        }
      }
    } catch {
      // Continuar con la generación
    }
  }

  // 2. Seleccionar un prompt inspirador
  const randomIndex = Math.floor(Math.random() * PROMPTS.length);
  let prompt = PROMPTS[randomIndex]
    .replace("${artistName}", safeArtist)
    .replace("${title}", safeTitle);

  console.log(`[ImageGen] Generando portada ${coverType} para: ${safeArtist} - ${safeTitle}`);

  // 3. Generar la imagen con IA (Google Imagen 3 / DALL-E / Flux)
  const generatedImageUrl = await generateImageFromPrompt(
    prompt,
    username,
    safeArtist,
    safeTitle
  );

  if (!generatedImageUrl) {
    return null;
  }

  // 4. Si es una data URI (de Google Imagen 3) o URL externa, intentar guardarla en Supabase si está disponible
  if (isSupabaseConfigured) {
    try {
      let imageBuffer: Buffer | null = null;

      if (generatedImageUrl.startsWith("data:image")) {
        const base64Data = generatedImageUrl.split(",")[1];
        imageBuffer = Buffer.from(base64Data, "base64");
      } else if (generatedImageUrl.startsWith("http")) {
        const imgRes = await fetch(generatedImageUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
        }
      }

      if (imageBuffer) {
        const storageUrl = await uploadImageToStorage(imageBuffer, filePath);
        if (storageUrl) {
          await saveImageMetadata(safeArtist, storageUrl);
          return storageUrl;
        }
      }
    } catch (storageErr: any) {
      console.warn("[Storage] Guardado opcional en Supabase omitido:", storageErr?.message);
    }
  }

  // 5. Retornar directamente la URL generada (base64 o URL remota de Flux)
  return generatedImageUrl;
}

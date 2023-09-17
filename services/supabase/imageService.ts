import { supabase } from "../../lib/supabase";
import { generateImageFromPrompt } from "../openai/generateImageFromPrompt";
import { sanitizeFileName } from "../../lib/stringUtils";

const SUPABASE_STORAGE_URL =
  "https://psjhsoburgocxzalocmc.supabase.co/storage/v1/object/public/generated_images/";

  const PROMPTS = [
    "Digital Painting of a ${artistName}. The image transmit a sense of wonder and exploration. The art is incredibly detailed. The characters are all unique and interesting.",
    "A hyper real digital painting for ${title}, finely detailed armor, intricate design, silver, silk, cinematic lighting, 4k. The image transmit a sense of wonder and exploration. The art is incredibly detailed. The characters are all unique and interesting",
    "High quality pastel coloured film mid angle portrait music band ${artistName}, atmospheric three point light. photographic. art directed. ( pastel colours ). volumetric. clearcoat. waves. 8 k. filmic.",
    "Cinematic photo of ${title}. The image transmit a sense of wonder and exploration. The art is incredibly detailed. The characters are all unique and interesting"
  ];



  

async function uploadImageToStorage(
  imageData: Buffer,
  filePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("generated_images")
    .upload(filePath, imageData);

  if (error) {
    console.error("Error subiendo la imagen:", error);
    return null;
  }

  return SUPABASE_STORAGE_URL + filePath; // <- Aquí combinamos la URL base con el filePath
}

async function saveImageMetadata(
  artistName: string,
  imageUrl: string
): Promise<void> {
  const { error } = await supabase
    .from("generated_images_metadata")
    .insert([{ artist_name: artistName, image_url: imageUrl }]);

  if (error) {
    console.error("Error al guardar metadatos de la imagen:", error);
  }
}

export async function fetchOrGenerateImage(
  artistName: string,
  coverType: "front" | "back",
  title: string
): Promise<string | null> {
  console.log(
    `Buscando imagen para el artista: ${artistName} - ${title} y tipo de portada: ${coverType}`
  );

  const sanitizedArtistName = sanitizeFileName(artistName);
  const filePath = `uploads/${sanitizedArtistName}_${coverType}.jpg`;

  // Directamente construimos la imageUrl combinando la URL base con el filePath
  const imageUrl = SUPABASE_STORAGE_URL + filePath;

  const response = await fetch(imageUrl);
  if (response.ok) {
    console.log(
      `Imagen encontrada en Supabase Storage para ${artistName} y ${coverType}: ${imageUrl}`
    );
    return imageUrl;
  }

  console.log(
    `Imagen no encontrada para ${artistName} y ${coverType}. Generando una nueva...`
  );

  const randomIndex = Math.floor(Math.random() * PROMPTS.length);
  let prompt = PROMPTS[randomIndex];
  prompt = prompt.replace('${artistName}', artistName);
prompt = prompt.replace('${title}', title);
console.log("PROMPT ELEJIDO:" , prompt)
  const generatedImageUrl = await generateImageFromPrompt(prompt);
  console.log("URL de la imagen generada:", generatedImageUrl);

  const generatedImageResponse = await fetch(generatedImageUrl);
  const generatedImageBlob = await generatedImageResponse.blob();

  const imageDataBuffer = Buffer.from(await generatedImageBlob.arrayBuffer());
  console.log(
    "Blob convertido a Buffer. Tamaño:",
    imageDataBuffer.length,
    "bytes"
  );

  const finalImageUrl = await uploadImageToStorage(imageDataBuffer, filePath);

  if (!finalImageUrl) {
    console.error("Error al subir imagen generada a Supabase Storage.");
    return null;
  }

  console.log(`Imagen subida a Supabase Storage: ${finalImageUrl}`);

  // Guardamos los metadatos de la imagen en la tabla
  await saveImageMetadata(artistName, finalImageUrl);

  return finalImageUrl;
}

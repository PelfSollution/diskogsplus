import { supabase } from "../../lib/supabase";
import { generateImageFromPrompt } from "../openai/generateImageFromPrompt";
import { sanitizeFileName } from "../../lib/stringUtils";

async function uploadImageToStorage(imageData: Buffer, filePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from('generated_images').upload(filePath, imageData);
    
    if (error) {
      console.error('Error subiendo la imagen:', error);
      return null;
    }
    
    return filePath;  
}


export async function fetchOrGenerateImage(artistName: string, coverType: 'front' | 'back'): Promise<string | null> {
    console.log(`Buscando imagen para el artista: ${artistName} y tipo de portada: ${coverType}`);
    const sanitizedArtistName = sanitizeFileName(artistName); // Sanitizamos el nombre del artista
     const filePath = `uploads/${sanitizedArtistName}_${coverType}.jpg`;
    const publicUrlData = await supabase.storage.from('generated_images').getPublicUrl(filePath);
    const imageUrl = publicUrlData?.data?.publicUrl || "";

    const response = await fetch(imageUrl);
    if (response.ok) {
        console.log(`Imagen encontrada en Supabase Storage para ${artistName} y ${coverType}: ${imageUrl}`);
        return imageUrl;
    }

    console.log(`Imagen no encontrada para ${artistName} y ${coverType}. Generando una nueva...`);
    const prompt = `Digital Painting of a ${artistName}. The image transmit a sense of wonder and exploration. The art is incredibly detailed. The characters are all unique and interesting.`;
    
    const generatedImageUrl = await generateImageFromPrompt(prompt);
    console.log('URL de la imagen generada:', generatedImageUrl);
    
    const generatedImageResponse = await fetch(generatedImageUrl);
    const generatedImageBlob = await generatedImageResponse.blob();
    
    // Convertir el Blob a Buffer
    const imageDataBuffer = Buffer.from(await generatedImageBlob.arrayBuffer());
    console.log('Blob convertido a Buffer. Tamaño:', imageDataBuffer.length, 'bytes');
    
    const finalImageUrl = await uploadImageToStorage(imageDataBuffer, filePath);
    
    if (!finalImageUrl) {
        console.error('Error al subir imagen generada a Supabase Storage.');
        return null; 
    }
    
    console.log(`Imagen subida a Supabase Storage: ${finalImageUrl}`);

    return finalImageUrl;
}

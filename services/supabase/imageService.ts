import { supabase } from "../../lib/supabase";
import { generateImageFromPrompt } from "../openai/generateImageFromPrompt";

export async function fetchOrGenerateImage(artistName: string, coverType: 'front' | 'back'): Promise<string> {
    console.log(`Buscando imagen para el artista: ${artistName} y tipo de portada: ${coverType}`);
    
    const { data, error } = await supabase
    .from('generated_images')
    .select('image_url')
    .eq('artist_name', artistName)
    .eq('cover_type', coverType)
    .limit(1);


    if (error) {
        console.error("Error fetching image from database:", error);
    }

 if (data && data[0] && data[0].image_url) {
    console.log(`Imagen encontrada en la base de datos para ${artistName} y ${coverType}: ${data[0].image_url}`);
    return data[0].image_url;
}else {
        console.log(`Imagen no encontrada para ${artistName} y ${coverType}. Generando una nueva...`);
        
        const prompt = `Digital Painting of a ${artistName}. The image transmit a sense of wonder and exploration. The art is incredibly detailed. The characters are all unique and interesting.`;
        const imageUrl = await generateImageFromPrompt(prompt);

        console.log(`Imagen generada: ${imageUrl}. Guardando en la base de datos...`);

        await supabase
            .from('generated_images')
            .insert({
                artist_name: artistName,
                cover_type: coverType,
                image_url: imageUrl
            });

        return imageUrl;
    }
}







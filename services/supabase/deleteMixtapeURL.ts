import { supabase } from "../../lib/supabase";

export async function deleteMixtapeURL(rawPlaylistId: string) {
    // Construye la URL completa del mixtape
    const embedUrl = `https://open.spotify.com/embed/playlist/${rawPlaylistId}`;

    const { error } = await supabase
        .from('mixtape_urls')
        .delete()
        .eq('mixtape_url', embedUrl);

    if (error) {
        throw error;
    }
}


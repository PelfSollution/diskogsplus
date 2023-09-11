import { supabase } from "../../lib/supabase";

export async function deleteMixtapeURL(embedUrl: string) {
    const { error } = await supabase
        .from('mixtape_urls')
        .delete()
        .eq('mixtape_url', embedUrl);

    if (error) {
        throw error;
    }
}

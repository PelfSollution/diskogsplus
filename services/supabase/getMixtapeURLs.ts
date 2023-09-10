import { supabase } from "../../lib/supabase";

export async function getMixtapeURLs(username: string) {
    const { data, error } = await supabase
        .from('mixtape_urls')
        .select('mixtape_url')
        .eq('username', username);
    
    if (error) {
        throw error;
    }
    
    return data;
}

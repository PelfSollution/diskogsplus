import { supabase } from "../../lib/supabase";

export type MixtapeEntry = {
    username: string;
    mixtape_url: string;
};

export async function saveMixtapeURL(username: string, mixtapeURL: string) {
    const entry: MixtapeEntry = { username, mixtape_url: mixtapeURL };
    console.log("Saving mixtape URL:", entry);
    const response = await supabase
    .from('mixtape_urls')
    .insert([entry]);

    if (response.error) {
        throw response.error;
    }
    
    return response.data;
}

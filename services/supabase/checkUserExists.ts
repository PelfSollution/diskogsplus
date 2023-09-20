import { supabase } from "@/lib/supabase";

export async function checkUserExists(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("username", username);

    if (error) {
      console.error("Error verificando usuario en Supabase:", error);
      throw error;
    }

    return data && data.length > 0; 
  } catch (error) {
    console.error("Error verificando usuario en Supabase:", error);
    return false;
  }
}

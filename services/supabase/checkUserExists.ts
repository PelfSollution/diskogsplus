import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function checkUserExists(username: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }
  try {
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("username", username);

    if (error) {
      console.warn("Aviso verificando usuario en Supabase:", error.message);
      return false;
    }

    return Boolean(data && data.length > 0);
  } catch (error: any) {
    console.warn("Aviso verificando usuario en Supabase:", error?.message || error);
    return false;
  }
}

import { createClient } from "@supabase/supabase-js";

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return createClient("https://placeholder.supabase.co", "placeholder-key");
  }

  return createClient(supabaseUrl, supabaseKey);
}

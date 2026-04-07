import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("Browser client - SUPABASE_URL:", supabaseUrl ? "Set" : "Not set");
  console.log("Browser client - SUPABASE_ANON_KEY:", supabaseKey ? "Set" : "Not set");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables. Please check your .env.local file.");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

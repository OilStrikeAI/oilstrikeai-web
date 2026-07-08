// Supabase client for use in Client Components ("use client" files).
// Reads the two public env vars — safe to expose to the browser, they only
// grant what Row Level Security allows for the signed-in user.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

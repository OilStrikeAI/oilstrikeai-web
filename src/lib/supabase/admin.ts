// Privileged Supabase client for server-only code paths that have no logged-in
// user to scope Row Level Security to: the public free-audit endpoint (nobody
// is authenticated yet) and the daily reminder cron job (runs across every
// company, not just one). Bypasses RLS entirely — never import this into a
// Client Component and never send SUPABASE_SERVICE_ROLE_KEY to the browser.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — the admin client cannot be created."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Resolves the logged-in user + their company/role for authenticated API
// routes. Uses the cookie-scoped Supabase client (not the admin client), so
// every read/write that follows is still bound by Row Level Security —
// this only tells a route *who* is asking, it doesn't bypass anything.
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserAndCompany() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, company_id, role, full_name, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return { supabase, user, profile };
}

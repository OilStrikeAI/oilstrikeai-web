// Handles the link inside the "Confirm your email" message sent by Supabase
// Auth on signup. Exchanges the token for a real session (setting cookies via
// the SSR-aware server client) then sends the person straight to their
// dashboard — no separate "click here to log in" step required.
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Team invites land on set-password first (they have no password yet);
  // a normal signup confirmation goes straight to the dashboard.
  const next = searchParams.get("next") ?? (type === "invite" ? "/auth/set-password" : "/dashboard");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}

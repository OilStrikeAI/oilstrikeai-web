// One-click unsubscribe for lead-nurture emails — required for any
// unsolicited outreach. No auth needed (that's the point of a one-click
// unsubscribe link), scoped to a single company by its own UUID, which is
// unguessable enough for an opt-out link (not a security boundary, just a
// courtesy stop).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company");

  if (!companyId) {
    return NextResponse.json({ error: "Missing company." }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("companies").update({ unsubscribed: true }).eq("id", companyId);

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0b1220;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <p>You've been unsubscribed. You won't receive further emails from OilStrikeAI unless you sign up again.</p>
    </body></html>`,
    { headers: { "content-type": "text/html" } }
  );
}

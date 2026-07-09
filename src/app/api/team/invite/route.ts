// Lets a director or manager add a teammate to their own company. Uses the
// Supabase admin API (service role) to actually send the invite email, since
// creating another company's auth user needs privileges the caller's own
// session doesn't have — but every check before that point uses the
// caller's real authenticated session, so only a director/manager of THIS
// company can invite into it.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/errorLog";

export async function POST(request: Request) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  if (profile.role !== "director" && profile.role !== "manager") {
    return NextResponse.json({ error: "Only a director or manager can invite teammates." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const email = (body.email as string | undefined)?.trim();
    const fullName = (body.fullName as string | undefined)?.trim() || "";
    const role = (body.role as string | undefined) === "manager" ? "manager" : "employee";

    if (!email) {
      return NextResponse.json({ error: "An email address is required." }, { status: 400 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("max_team_seats")
      .eq("id", profile.company_id)
      .maybeSingle();

    const { count: currentSeats } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", profile.company_id);

    if (company && currentSeats != null && currentSeats >= company.max_team_seats) {
      return NextResponse.json(
        {
          error: `Your plan includes ${company.max_team_seats} team seat(s), and you're already using all of them. Upgrade your plan to add more.`,
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_company_id: profile.company_id,
        invited_role: role,
        full_name: fullName,
      },
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    await admin.from("activity_log").insert({
      company_id: profile.company_id,
      actor: profile.full_name || "A team member",
      action: `Invited a new ${role} to the team:`,
      target: email,
    });

    return NextResponse.json({ invited: true });
  } catch (err) {
    console.error("[/api/team/invite] failed:", err);
    await logError("/api/team/invite", err, profile.company_id);
    const message = err instanceof Error ? err.message : "Something went wrong sending the invite.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

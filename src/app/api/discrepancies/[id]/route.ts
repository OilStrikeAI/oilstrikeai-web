// Lets a signed-in user mark a real finding resolved or disputed — RLS
// (company scoped update) already guarantees this only touches the
// caller's own company's rows, so no extra ownership check is needed here.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { logError } from "@/lib/errorLog";

export async function PATCH(request: Request, ctx: RouteContext<"/api/discrepancies/[id]">) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const status = body.status as string | undefined;

    if (!status || !["open", "resolved", "disputed"].includes(status)) {
      return NextResponse.json({ error: "A valid status is required." }, { status: 400 });
    }

    const { error } = await supabase.from("discrepancies").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("[/api/discrepancies/[id]] failed:", err);
    await logError("/api/discrepancies/[id]", err, profile.company_id);
    const message = err instanceof Error ? err.message : "Could not update this finding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

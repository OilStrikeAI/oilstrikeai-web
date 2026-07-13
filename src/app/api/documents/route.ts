// Lists the signed-in user's own company's previously analyzed documents,
// newest first — feeds the sidebar's "Previous Documents" section and the
// full /dashboard/documents list. RLS-scoped via the cookie-authenticated
// client, same pattern as /api/queue.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase } = session;

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, file_name, document_type, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: documents ?? [] });
}

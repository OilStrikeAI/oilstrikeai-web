// Generates a short-lived signed URL for a task update's attachment, rather
// than making the storage bucket itself publicly readable. Access is scoped
// by re-checking the update's company_id against the caller's own — anyone
// in the company can view a teammate's attached work, matching task_updates'
// existing "company scoped select" RLS policy.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ updateId: string }> }) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;
  const { updateId } = await params;

  const { data: update } = await supabase
    .from("task_updates")
    .select("company_id, attachment_path, attachment_name")
    .eq("id", updateId)
    .maybeSingle();

  if (!update || update.company_id !== profile.company_id) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }
  if (!update.attachment_path) {
    return NextResponse.json({ error: "This update has no attachment." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("task-attachments")
    .createSignedUrl(update.attachment_path, 60, { download: update.attachment_name || true });

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not generate a download link." }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}

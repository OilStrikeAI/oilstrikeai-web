// Every finding OilStrikeAI surfaced for one specific document — powers the
// "Previous Documents" detail view. RLS (company_id scoping) means a request
// for another company's document id simply returns nothing, not an error.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase } = session;
  const { id } = await params;

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, file_name, document_type, status, created_at, analysis_duration_seconds")
    .eq("id", id)
    .maybeSingle();

  if (documentError) {
    return NextResponse.json({ error: documentError.message }, { status: 500 });
  }
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, contract_number, parties, effective_date, expiry_date")
    .eq("document_id", id)
    .maybeSingle();

  let discrepancies: unknown[] = [];
  let obligations: unknown[] = [];
  if (contract) {
    const [discrepanciesRes, obligationsRes] = await Promise.all([
      supabase.from("discrepancies").select("*").eq("contract_id", contract.id),
      supabase.from("obligations").select("*").eq("contract_id", contract.id),
    ]);
    discrepancies = discrepanciesRes.data ?? [];
    obligations = obligationsRes.data ?? [];
  }

  return NextResponse.json({ document, contract, discrepancies, obligations });
}

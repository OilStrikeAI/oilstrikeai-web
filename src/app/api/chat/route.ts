// Ask-Anything Chat: GET loads the signed-in user's own conversation history,
// POST sends a new question and gets a real answer grounded in their
// company's actual data. Both fully RLS-scoped via the cookie-authenticated
// client — no admin client needed here.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { askAssistant, type ChatMessage } from "@/lib/chatAssistant";
import { logError } from "@/lib/errorLog";

export const maxDuration = 60;
const HISTORY_LIMIT = 30;

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(request: Request) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile, user } = session;

  try {
    const body = await request.json();
    const question = (body.question as string | undefined)?.trim();
    if (!question) {
      return NextResponse.json({ error: "A question is required." }, { status: 400 });
    }

    const [{ data: recentHistory }, { data: contracts }, { data: discrepancies }, { data: obligations }] =
      await Promise.all([
        supabase
          .from("chat_messages")
          .select("role, content, created_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(HISTORY_LIMIT),
        supabase.from("contracts").select("contract_number, parties, effective_date"),
        supabase.from("discrepancies").select("title, category, tier, explanation, amount, page_reference, status"),
        supabase.from("obligations").select("title, due_date, severity, assigned_team, status"),
      ]);

    const history: ChatMessage[] = [...(recentHistory ?? [])]
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const { data: company } = await supabase.from("companies").select("name").eq("id", profile.company_id).maybeSingle();

    const answer = await askAssistant({
      context: {
        companyName: company?.name || "your company",
        userName: profile.full_name || user.email || "there",
        userRole: profile.role,
        contracts: contracts ?? [],
        discrepancies: discrepancies ?? [],
        obligations: obligations ?? [],
      },
      history,
      question,
    });

    const { error: insertError } = await supabase.from("chat_messages").insert([
      { company_id: profile.company_id, user_id: profile.id, role: "user", content: question },
      { company_id: profile.company_id, user_id: profile.id, role: "assistant", content: answer },
    ]);
    if (insertError) {
      console.error("[/api/chat] failed to save messages:", insertError);
    }

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[/api/chat] failed:", err);
    await logError("/api/chat", err, profile.company_id);
    const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

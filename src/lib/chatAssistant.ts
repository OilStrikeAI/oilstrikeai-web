// The Ask-Anything Chat — answers questions using the company's own real
// data, re-read fresh on every message. Deliberately has no long-term
// memory across sessions: the company's database already IS the memory
// (past findings, resolved issues, deadlines), so the assistant just reads
// the current state of that data every time rather than trying to recall a
// fuzzy old conversation. Only in-conversation history is kept.
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const CHAT_MODEL = "claude-sonnet-5";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type CompanyContext = {
  companyName: string;
  userName: string;
  userRole: string;
  contracts: Array<{ contract_number: string | null; parties: string[] | null; effective_date: string | null }>;
  discrepancies: Array<{
    title: string;
    category: string;
    tier: string;
    explanation: string;
    amount: number | null;
    page_reference: string | null;
    status: string;
  }>;
  obligations: Array<{
    title: string;
    due_date: string | null;
    severity: string;
    assigned_team: string;
    status: string;
  }>;
};

function buildSystemPrompt(ctx: CompanyContext): string {
  const contractsBlock = ctx.contracts.length
    ? ctx.contracts
        .map(
          (c) =>
            `- Contract ${c.contract_number || "(no number)"} — parties: ${
              (c.parties || []).join(", ") || "unknown"
            }, effective ${c.effective_date || "unknown"}`
        )
        .join("\n")
    : "(no contracts on file yet)";

  const discrepanciesBlock = ctx.discrepancies.length
    ? ctx.discrepancies
        .map(
          (d) =>
            `- [${d.status}] [${d.tier}/${d.category}] ${d.title}${d.amount ? ` ($${d.amount.toLocaleString("en-US")})` : ""} — ${d.explanation} (${d.page_reference || "n/a"})`
        )
        .join("\n")
    : "(no discrepancies on file yet)";

  const obligationsBlock = ctx.obligations.length
    ? ctx.obligations
        .map(
          (o) =>
            `- [${o.status}] ${o.title} — due ${o.due_date || "no fixed date"}, ${o.severity} priority, assigned to ${o.assigned_team}`
        )
        .join("\n")
    : "(no obligations on file yet)";

  return `You are the OilStrikeAI assistant, embedded in ${ctx.companyName}'s dashboard. You're talking to ${ctx.userName} (${ctx.userRole}).

Answer using ONLY the real company data below — never invent a fact, a number, or a deadline that isn't in it. If the data doesn't cover what's being asked, say so plainly and suggest what document to upload or what to check next, instead of guessing.

Write in clear, professional English — the way a sharp colleague would answer, not a canned support bot. When relevant, name the specific finding or obligation you're referencing.

## ${ctx.companyName}'s current data

### Contracts on file
${contractsBlock}

### Discrepancies (financial, legal, operational, fraud-risk findings)
${discrepanciesBlock}

### Obligations & deadlines
${obligationsBlock}
`;
}

export async function askAssistant(params: {
  context: CompanyContext;
  history: ChatMessage[];
  question: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: 1500,
      system: buildSystemPrompt(params.context),
      messages: [
        ...params.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: params.question },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const textBlock = (data.content as Array<Record<string, unknown>>)?.find((b) => b.type === "text");
  if (!textBlock || typeof textBlock.text !== "string") {
    throw new Error("The assistant did not return a text reply.");
  }
  return textBlock.text;
}

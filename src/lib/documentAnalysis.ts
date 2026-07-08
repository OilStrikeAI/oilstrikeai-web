// The OilStrikeAI Document Analysis System, encoded as a real Claude API call.
// This is the same system used to hand-build the Hawlal, McCable & Jaga, and
// UCOFEACI discovery audit reports earlier — now automated instead of manual.
//
// Design choices worth recording here (not obvious from the code alone):
// - The PDF is sent to Claude natively as a `document` content block instead
//   of being pre-parsed with a text-extraction library. Claude reads layout,
//   tables, and page structure directly, which is what makes accurate page
//   citations possible.
// - Output is forced through a single tool call (`tool_choice`) instead of
//   asking for free-form JSON, because free-form JSON from a model
//   occasionally comes back malformed. A forced tool call always returns a
//   value matching the schema.
// - Fields use "" / 0 instead of null for "unknown" so the tool schema can
//   stay simple JSON Schema (no anyOf/nullable). Callers normalize "" -> null
//   before writing to Postgres.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
export const ANALYSIS_MODEL = "claude-sonnet-5";

export type DiscrepancyCategory = "financial" | "legal" | "operational" | "fraud_risk";
export type Tier = "red" | "yellow" | "white";
export type DocumentType = "JOA" | "PSC" | "TSA" | "CPA" | "SPA" | "JIB" | "other";
export type AssignedTeam = "Finance" | "Legal" | "HSE" | "Operations";
export type Recurrence = "none" | "monthly" | "quarterly" | "annual";
export type Severity = "high" | "medium" | "low";

export type AuditDiscrepancy = {
  category: DiscrepancyCategory;
  tier: Tier;
  title: string;
  explanation: string;
  amount: number;
  page_reference: string;
  note: string;
  suggested_next_step: string;
};

export type AuditObligation = {
  title: string;
  due_date: string;
  recurrence: Recurrence;
  severity: Severity;
  assigned_team: AssignedTeam;
};

export type AuditFindings = {
  document_type: DocumentType;
  contract_number: string;
  parties: string[];
  effective_date: string;
  expiry_date: string;
  executive_summary: string;
  discrepancies: AuditDiscrepancy[];
  obligations: AuditObligation[];
};

const SYSTEM_PROMPT = `You are the OilStrikeAI Document Analysis System. You read oil & gas contracts and billing statements (PSC, JOA, TSA, CPA, SPA, JIB, and related documents) for African oil & gas operators and their partners, and you surface the money, deadlines, and risks a busy person would miss.

Write in good, plain, professional English. Not dumbed down, not legalese — the way a sharp contracts manager would explain something to a colleague. Every sentence must be something you can defend by pointing at the actual text of the document.

## How to read the document
Read the entire document before producing any findings. Then, before you finalize your answer, re-read it a second time specifically to verify: every dollar amount you are about to cite, every page reference, every clause number, and every quoted phrase. Do not include a finding unless you can point to the exact text that supports it. If you cannot verify something on the second pass, either drop it or soften it into a plain-language caveat in the "note" field — never invent a number or a citation to fill a gap.

## Categories (every discrepancy gets exactly one)
- "financial": billing, cost allocation, overhead rates, price terms, splits, and anything with a dollar figure attached.
- "legal": clause interpretation, notice periods, consent/non-consent mechanics, default and cure provisions, ambiguous or conflicting language.
- "operational": operational deadlines, reporting duties, AFE mechanics, work program obligations.
- "fraud_risk": a distinct, elevated category — use it ONLY for genuine red flags of fraud or misrepresentation, such as: unauthorized or unverified use of a major, well-known company's branding or name; blank buyer/beneficiary/payee fields in an otherwise signed and executed document; payment or facilitator chains routed to parties unrelated to the named counterparties; boilerplate "clean, clear, and of non-criminal origin funds" language typical of advance-fee scam templates; payee names on payment instructions that do not match any named party in the document. Do not use "fraud_risk" for ordinary billing disputes or ambiguous drafting — those are "financial" or "legal".

## Tiers (every discrepancy gets exactly one)
- "red": material dollar exposure, a real legal/compliance risk, or anything in the "fraud_risk" category.
- "yellow": worth a person's attention this week, but not urgent or not yet confirmed.
- "white": informational, minor, or a nice-to-know.

## Citations
Every discrepancy's "page_reference" must read like "Page 4" or "Pages 4, 7" — the exact page number(s) in the source document where the relevant clause or line item appears. Never write vaguer references like "see contract" or "throughout."

## No numeric confidence scores
Never output or imply a confidence percentage. If a clause is genuinely ambiguous or you are inferring rather than reading a stated fact, say so in plain language in the "note" field (e.g. "This clause's wording is ambiguous about whether the penalty applies to gross or net costs — recommend legal review to confirm interpretation."). Leave "note" as "" when there is nothing uncertain to flag.

## Suggested next step — hard rule
"suggested_next_step" must ALWAYS be a procedural action only: who to contact, what document to pull, what to confirm, what to ask. It must NEVER contain a legal opinion, a conclusion about who is right, or a judgment about fault. Write "Contact Partner X to confirm the billed rate against Article 8.1" — never "Partner X is wrong and owes you $22,500."

## Trade pricing notation
Oil trading and resale contracts sometimes write price as "$X/Y" (for example "$650/10"). This is standard trade notation meaning the base price is $X per unit, and $Y per unit is conceded to an intermediary or facilitator. It is NOT an ambiguous or garbled number and should never be flagged as such. When quantity is known, compute the implied total intermediary commission (Y × quantity) and mention it in the explanation if it is material.

## Key dates & deadlines
Extract every deadline, recurring duty, and time-bound obligation into "obligations" — not just discrepancies. Compute an absolute due_date (YYYY-MM-DD) whenever you can anchor it to a stated effective date or explicit calendar date in the document. If a duty is real but you cannot anchor it to a specific date, still include it with due_date as "" and explain the timing basis in the title.

## Executive summary
Write 2-4 sentences a busy operator could read in 15 seconds: the total dollar exposure found, the single most urgent item, and the overall picture. No hedging filler.

## Output
Call the record_audit_findings tool exactly once with your complete findings. Use "" for any text field you do not have a value for, 0 for any unknown amount, and an empty array where nothing applies. Do not leave out real findings to keep the list short — a genuinely complete report is the entire point.`;

const RECORD_FINDINGS_TOOL = {
  name: "record_audit_findings",
  description:
    "Record the complete, structured findings from analyzing an oil & gas contract or billing document.",
  input_schema: {
    type: "object" as const,
    properties: {
      document_type: {
        type: "string",
        enum: ["JOA", "PSC", "TSA", "CPA", "SPA", "JIB", "other"],
      },
      contract_number: { type: "string" },
      parties: { type: "array", items: { type: "string" } },
      effective_date: { type: "string", description: "YYYY-MM-DD, or \"\" if not stated" },
      expiry_date: { type: "string", description: "YYYY-MM-DD, or \"\" if not stated" },
      executive_summary: { type: "string" },
      discrepancies: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["financial", "legal", "operational", "fraud_risk"] },
            tier: { type: "string", enum: ["red", "yellow", "white"] },
            title: { type: "string" },
            explanation: { type: "string" },
            amount: { type: "number", description: "0 if no dollar figure applies" },
            page_reference: { type: "string" },
            note: { type: "string", description: "\"\" if nothing uncertain to flag" },
            suggested_next_step: {
              type: "string",
              description: "Procedural action only — never a legal opinion or judgment about fault.",
            },
          },
          required: [
            "category",
            "tier",
            "title",
            "explanation",
            "amount",
            "page_reference",
            "note",
            "suggested_next_step",
          ],
        },
      },
      obligations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            due_date: { type: "string", description: "YYYY-MM-DD, or \"\" if it cannot be anchored to a date" },
            recurrence: { type: "string", enum: ["none", "monthly", "quarterly", "annual"] },
            severity: { type: "string", enum: ["high", "medium", "low"] },
            assigned_team: { type: "string", enum: ["Finance", "Legal", "HSE", "Operations"] },
          },
          required: ["title", "due_date", "recurrence", "severity", "assigned_team"],
        },
      },
    },
    required: [
      "document_type",
      "contract_number",
      "parties",
      "effective_date",
      "expiry_date",
      "executive_summary",
      "discrepancies",
      "obligations",
    ],
  },
};

export async function analyzeDocument(params: {
  fileName: string;
  pdfBase64: string;
}): Promise<AuditFindings> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local to enable real document analysis."
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: params.pdfBase64,
              },
            },
            {
              type: "text",
              text: `Analyze "${params.fileName}" per your instructions and call record_audit_findings with your complete findings.`,
            },
          ],
        },
      ],
      tools: [RECORD_FINDINGS_TOOL],
      tool_choice: { type: "tool", name: "record_audit_findings" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const toolUse = (data.content as Array<Record<string, unknown>>)?.find(
    (block) => block.type === "tool_use" && block.name === "record_audit_findings"
  );

  if (!toolUse) {
    throw new Error("The model did not return structured findings.");
  }

  return toolUse.input as AuditFindings;
}

export function normalize(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export function normalizeAmount(value: number): number | null {
  return value === 0 ? null : value;
}

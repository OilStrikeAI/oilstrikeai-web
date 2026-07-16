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
// Dashboard customers (paying subscribers) get the strongest model. The free
// public audit is a lead magnet, not a paid deliverable — a cheaper model
// there keeps the cost of anonymous, unlimited-attempt abuse-prone traffic
// low without touching the quality real subscribers pay for.
export const ANALYSIS_MODEL = "claude-sonnet-5";
export const FREE_AUDIT_MODEL = "claude-haiku-4-5-20251001";

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
  recurrence_basis: Recurrence;
  stakes: string;
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
  is_analyzable: boolean;
  rejection_reason: string;
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

## Is this even analyzable? — check this first
Before doing anything else, decide whether this document is genuinely something you can produce a real audit from. Set "is_analyzable" to false, and explain why in plain language in "rejection_reason", if EITHER of these is true:
- The document has nothing to do with oil & gas contracts, joint venture billing, or related commercial/legal agreements (e.g. it's an unrelated file, a personal document, an image with no real text, a resume, a receipt for something unrelated).
- The document is genuinely too short, blank, or low-content to support any real finding (e.g. a cover page only, a single paragraph, a corrupted/empty scan).
When "is_analyzable" is false, leave "discrepancies" and "obligations" as empty arrays and "executive_summary" as "" — do not force a finding out of a document that doesn't support one. When "is_analyzable" is true, set "rejection_reason" to "".

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

## Multiple fee/commission lines — hard rule, for stability across re-analysis
When a document contains several distinct per-unit fees or commissions (e.g., separate facilitator, agent, and mandate fees, each its own "$X/Y" line), record them as ONE single discrepancy covering the whole suspicious payment structure — never split them into several separate discrepancy entries. Re-analyzing the identical document must always produce the identical grouping, not an arbitrary different split each time. List each individual fee line and its own computed total in the "explanation" text. Only set that discrepancy's "amount" field to a single combined dollar figure if the document itself states that combined total explicitly — if it does not, leave "amount" at 0 and let the per-line totals live in the explanation text instead of inventing your own grand total.

## When NOT to attach a dollar amount — hard rule
Many findings are not fundamentally about money and must get "amount": 0, even though other numbers appear elsewhere in the document. Examples that must NEVER get a computed or estimated "amount": a quantity or unit mismatch (e.g., "100,000 MT vs. 50,000 MT" — this is a logical inconsistency, not a cost), a date or validity-window problem, a blank or inconsistent identity field, a non-existent named arbitration body, spelling/naming inconsistencies, or a conflict between multiple stated prices where the document does not itself say which price governs or what quantity applies to the disputed difference. Do not multiply unrelated numbers together (e.g., a price difference × an unrelated quantity figure) to manufacture a dollar total — if the document does not directly state or directly support one specific number for a finding, leave "amount" at 0 and explain the issue in words instead. Only set a non-zero "amount" when the finding is itself fundamentally a cost, fee, or billing figure AND that number is directly stated or directly computable from figures the document explicitly gives for that exact finding.

## Showing real value, honestly — hard rule
Every discrepancy must include a "stakes" sentence: one concise, honest sentence stating what is genuinely protected or at risk if this finding is acted on. This is NOT a place to invent urgency or exaggerate — it must be something you can defend from the document. For a financial finding, restate the dollar stake in plain words (e.g. "Correcting this recovers the $22,500 overbilled this cycle"). For a legal, operational, or fraud_risk finding with no dollar figure, describe the concrete real-world stake instead of a dollar amount (e.g. "Protects your right to elect non-consent within the required window" or "Prevents a payment from being routed to an unverified third party"). Never write a vague filler sentence — always name the specific thing at stake.

"recurrence_basis" must be "none" UNLESS the document itself explicitly shows this is a recurring cycle — for example the document is titled or described as a monthly/quarterly JIB, cost recovery statement, or the clause itself states a recurring cadence. When the document clearly states a cadence, set "recurrence_basis" to that cadence so a one-time dollar finding can be honestly annotated as "per cycle" rather than a one-off. Never guess or assume recurrence just because the document type is normally recurring in the industry — only set it when the document itself says so.

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
      is_analyzable: {
        type: "boolean",
        description: "false if this document is unrelated to oil & gas contracts/billing, or has too little content to analyze.",
      },
      rejection_reason: {
        type: "string",
        description: "Plain-language reason when is_analyzable is false; \"\" otherwise.",
      },
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
            recurrence_basis: {
              type: "string",
              enum: ["none", "monthly", "quarterly", "annual"],
              description: "Only set when the document itself explicitly states this cadence — never assumed.",
            },
            stakes: {
              type: "string",
              description: "One honest sentence naming what is specifically protected or at risk — never invented or vague.",
            },
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
            "recurrence_basis",
            "stakes",
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
      "is_analyzable",
      "rejection_reason",
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
  model?: string;
}): Promise<AuditFindings> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local to enable real document analysis."
    );
  }

  const modelToUse = params.model || ANALYSIS_MODEL;
  // Zero temperature: this is an extraction task, not a creative one — the
  // same document should produce the same dollar figures and findings every
  // time it's analyzed, not drift between runs. ANALYSIS_MODEL (Sonnet, used
  // for real paying-customer analysis) rejects this parameter outright
  // ("temperature is deprecated for this model") — only send it for models
  // that actually accept it.
  const supportsTemperature = modelToUse !== ANALYSIS_MODEL;

  const requestBody = JSON.stringify({
    model: modelToUse,
    max_tokens: 8000,
    ...(supportsTemperature ? { temperature: 0 } : {}),
    // The system prompt and tool schema are identical on every single call
    // (only the document itself changes) — marking them cacheable means
    // repeat calls only pay full price for the new document, not for
    // re-sending the same few thousand tokens of instructions every time.
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
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
    tools: [{ ...RECORD_FINDINGS_TOOL, cache_control: { type: "ephemeral" } }],
    tool_choice: { type: "tool", name: "record_audit_findings" },
  });

  // Anthropic's API occasionally returns a transient 429/500/503/529 (server
  // overloaded) that has nothing to do with the document itself — retrying
  // a couple of times with backoff turns a real-user-facing failure into a
  // few extra seconds of "Analyzing...", instead of surfacing a raw API
  // error on the very first hiccup.
  const RETRYABLE_STATUSES = new Set([429, 500, 503, 529]);
  const MAX_ATTEMPTS = 3;
  let lastErrorText = "";
  let lastStatus = 0;
  let response: Response | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: requestBody,
    });

    if (response.ok) break;

    lastStatus = response.status;
    lastErrorText = await response.text();

    if (attempt < MAX_ATTEMPTS && RETRYABLE_STATUSES.has(response.status)) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      continue;
    }

    console.error(`[documentAnalysis] Anthropic API error ${lastStatus} after ${attempt} attempt(s): ${lastErrorText}`);
    throw new Error(
      "The document analysis service is temporarily unavailable. Please try again in a minute — this is a rare, transient issue, not a problem with your document."
    );
  }

  const data = await response!.json();
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

// The model is instructed to always emit a full YYYY-MM-DD date or "", but
// occasionally emits a partial date (e.g. "2025-10") when a document only
// states a month/year — treated the same as "no fixed date" rather than
// letting a malformed string crash the insert for the whole document.
const FULL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export function normalizeDate(value: string): string | null {
  if (!FULL_DATE_PATTERN.test(value.trim())) return null;
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

export function normalizeAmount(value: number): number | null {
  return value === 0 ? null : value;
}

export const pricingTiers = [
  {
    name: "Tier 1 — Indie/Micro",
    price: "$1,500–$2,500",
    period: "/mo",
    description: "1–2 JV partners, under $5M annual JIB volume",
    features: [
      "JIB reconciliation vs. your JOA/PSC",
      "Obligation calendar with deadline alerts",
      "Monthly board-ready report",
      "Email support",
    ],
    cta: "Get Your Free Discovery Audit",
  },
  {
    name: "Tier 2 — Mid-size Indigenous",
    price: "$3,000–$6,000",
    period: "/mo",
    description: "3–6 JV partners, $5M–$50M annual JIB volume",
    features: [
      "Everything in Tier 1",
      "Multi-JV cross-contract conflict detection",
      "Daily reconciliation & obligation queue",
      "Priority support",
    ],
    cta: "Get Your Free Discovery Audit",
    highlighted: true,
  },
  {
    name: "Tier 3 — Large/IOC-adjacent",
    price: "Custom",
    period: "",
    description: "6+ JV partners, $50M+ annual JIB volume, multi-country",
    features: [
      "Everything in Tier 2",
      "Dedicated account manager",
      "Multi-entity, multi-country rollout",
      "Fractional Contracts & Compliance Partner retainer available",
    ],
    cta: "Contact Us",
  },
];

export const faqs = [
  {
    q: "Is our contract and billing data secure?",
    a: "Yes. All documents are encrypted at rest and in transit, access is restricted to your team, and every action is logged in an audit trail. We never share your data across clients.",
  },
  {
    q: "How accurate is the AI?",
    a: "Every discrepancy and obligation we surface is cited back to the exact clause and page it came from — nothing is a black box. Where language is ambiguous, we show a confidence score and flag it for human review instead of guessing.",
  },
  {
    q: "What happens if the AI gets something wrong?",
    a: "You can verify every finding against the source document with one click. Nothing is ever auto-sent to a partner without a human on your team reviewing and approving it first.",
  },
  {
    q: "What if the free audit doesn't find $50,000 in discrepancies?",
    a: "If we don't find at least $50,000 in recoverable discrepancies or exposure, the audit is free and you owe us nothing. We'll still show you your full obligation calendar at no cost.",
  },
  {
    q: "Do we need to change our accounting system?",
    a: "No. You upload or forward your existing contracts and JIB statements — no integration or migration required to get started.",
  },
];

export type Discrepancy = {
  id: string;
  partner: string;
  amount: number;
  clause: string;
  clauseText: string;
  explanation: string;
  confidence: number;
  status: "open" | "resolved" | "disputed";
};

export const discrepancies: Discrepancy[] = [
  {
    id: "d1",
    partner: "Partner X (Non-Operator, 25% WI)",
    amount: 68000,
    clause: "Article 12.3 — Cost Recovery",
    clauseText:
      "Costs recoverable under this Article shall be allocated among the Parties in proportion to their respective Participating Interests, being 60% Operator and 40% Partner X for Development Costs incurred under the approved AFE.",
    explanation:
      "The Q3 JIB billed Partner X at a 50/50 split for drilling costs. Article 12.3 specifies a 60/40 split for Development Costs. Difference: $68,000 overbilled to Partner X.",
    confidence: 94,
    status: "open",
  },
  {
    id: "d2",
    partner: "Partner Y (Non-Operator, 15% WI)",
    amount: 22500,
    clause: "Article 8.1 — Overhead Rate",
    clauseText:
      "Operator shall be entitled to recover overhead at a rate not to exceed 3.0% of direct costs, as adjusted annually per the COPAS Accounting Procedure.",
    explanation:
      "This quarter's JIB applied a 3.4% overhead rate. The JOA caps overhead recovery at 3.0%. Difference: $22,500 overbilled to Partner Y.",
    confidence: 88,
    status: "open",
  },
  {
    id: "d3",
    partner: "Partner Z (Non-Operator, 20% WI)",
    amount: 9800,
    clause: "Article 14.2 — Non-Consent Penalty",
    clauseText:
      "A Non-Consenting Party electing not to participate shall bear a penalty of 300% of its share of the operation's costs upon subsequent participation.",
    explanation:
      "Partner Z's non-consent penalty was calculated on the wrong cost base. Language in this clause is ambiguous about whether penalty applies to gross or net costs — recommend legal review.",
    confidence: 61,
    status: "open",
  },
];

export type Obligation = {
  id: string;
  title: string;
  clause: string;
  dueInDays: number;
  severity: "high" | "medium" | "low";
  assignedTeam: "Finance" | "Legal" | "HSE";
};

export const obligations: Obligation[] = [
  {
    id: "o1",
    title: "Submit Annual Work Program & Budget to all partners",
    clause: "Article 6.4",
    dueInDays: 12,
    severity: "high",
    assignedTeam: "Finance",
  },
  {
    id: "o2",
    title: "Confirm insurance certificate renewal with Operator",
    clause: "Article 19.1",
    dueInDays: 27,
    severity: "medium",
    assignedTeam: "Legal",
  },
  {
    id: "o3",
    title: "Respond to AFE #2291 election (consent/non-consent)",
    clause: "Article 8.2",
    dueInDays: 5,
    severity: "high",
    assignedTeam: "Legal",
  },
  {
    id: "o4",
    title: "Quarterly decommissioning fund contribution due",
    clause: "Article 22.3",
    dueInDays: 45,
    severity: "low",
    assignedTeam: "Finance",
  },
];

export const riskScore = {
  current: 82,
  previous: 75,
  totalRecovered: 100300,
  openItems: 3,
};

export const sizingTiers = {
  micro: { employees: "10–50", jvCount: "1–2", jibVolume: "Under $5M" },
  mid: { employees: "50–300", jvCount: "3–6", jibVolume: "$5M–$50M" },
  large: { employees: "300+", jvCount: "6+", jibVolume: "$50M+" },
};

export type SizingAnswers = {
  employees: string;
  jvCount: string;
  jibVolume: string;
};

export function tierFromSizing(answers: SizingAnswers | null): (typeof pricingTiers)[number] {
  if (!answers) return pricingTiers[1];
  if (answers.jibVolume === "$50M+") return pricingTiers[2];
  if (answers.jibVolume === "$5M–$50M") return pricingTiers[1];
  return pricingTiers[0];
}

// --- Risk score history (feature 2: trend chart) ---
export const riskHistory = [
  { week: "Wk 1", score: 58, recovered: 0 },
  { week: "Wk 2", score: 61, recovered: 8000 },
  { week: "Wk 3", score: 60, recovered: 8000 },
  { week: "Wk 4", score: 65, recovered: 19500 },
  { week: "Wk 5", score: 69, recovered: 31000 },
  { week: "Wk 6", score: 68, recovered: 31000 },
  { week: "Wk 7", score: 72, recovered: 46000 },
  { week: "Wk 8", score: 75, recovered: 62000 },
  { week: "Wk 9", score: 74, recovered: 62000 },
  { week: "Wk 10", score: 78, recovered: 81500 },
  { week: "Wk 11", score: 75, recovered: 81500 },
  { week: "Wk 12", score: 82, recovered: 100300 },
];

// --- Notifications (feature 3: notification center) ---
export type Notification = {
  id: string;
  type: "discrepancy" | "obligation" | "approval" | "system";
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
};

export const notifications: Notification[] = [
  {
    id: "n1",
    type: "discrepancy",
    title: "New discrepancy found",
    detail: "Partner X overbilled $68,000 under Article 12.3",
    timestamp: "2h ago",
    read: false,
  },
  {
    id: "n2",
    type: "obligation",
    title: "Deadline approaching",
    detail: "AFE #2291 election due in 5 days",
    timestamp: "5h ago",
    read: false,
  },
  {
    id: "n3",
    type: "approval",
    title: "Notice awaiting your approval",
    detail: "Drafted notice to Partner Y ready for review",
    timestamp: "1d ago",
    read: false,
  },
  {
    id: "n4",
    type: "system",
    title: "Weekly digest sent",
    detail: "Sent to 3 team members via WhatsApp",
    timestamp: "3d ago",
    read: true,
  },
  {
    id: "n5",
    type: "discrepancy",
    title: "Discrepancy resolved",
    detail: "Partner Z overhead adjustment confirmed",
    timestamp: "4d ago",
    read: true,
  },
];

// --- Activity log (feature 4: audit trail) ---
export type ActivityEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
};

export const activityLog: ActivityEntry[] = [
  { id: "a1", actor: "Chidi (Manager)", action: "Approved drafted notice for", target: "Partner X — $68,000 discrepancy", timestamp: "Today, 9:14am" },
  { id: "a2", actor: "OilStrikeAI", action: "Flagged new discrepancy for", target: "Partner Y — Article 8.1 overhead rate", timestamp: "Today, 6:02am" },
  { id: "a3", actor: "Amara (Employee)", action: "Marked resolved:", target: "Partner Z non-consent penalty review", timestamp: "Yesterday, 4:47pm" },
  { id: "a4", actor: "OilStrikeAI", action: "Sent weekly digest to", target: "3 team members via WhatsApp", timestamp: "Monday, 8:00am" },
  { id: "a5", actor: "Chidi (Manager)", action: "Edited drafted notice for", target: "Partner Z before sending", timestamp: "Monday, 7:30am" },
  { id: "a6", actor: "OilStrikeAI", action: "Cross-referenced JIB against", target: "JOA_Block_12_Executed.pdf", timestamp: "Sunday, 11:58pm" },
];

// --- Forecast panel (feature 6: predictive tasks) ---
export type ForecastItem = {
  id: string;
  title: string;
  basis: string;
  estimatedDate: string;
  confidence: number;
};

export const forecastItems: ForecastItem[] = [
  {
    id: "f1",
    title: "Cash call likely from Partner X",
    basis: "Based on the $2M AFE approved on Block 12 (Article 7)",
    estimatedDate: "In ~38 days, payment due within 15 days after",
    confidence: 81,
  },
  {
    id: "f2",
    title: "Annual Work Program submission window opens",
    basis: "Based on Article 6.4's annual cycle and last year's timing",
    estimatedDate: "In ~60 days",
    confidence: 93,
  },
  {
    id: "f3",
    title: "Possible non-consent election from Partner Z",
    basis: "Based on Partner Z's pattern on the last 3 similar AFEs",
    estimatedDate: "Within 2 weeks of next AFE notice",
    confidence: 64,
  },
];

// --- Consequence chain (feature 7) ---
export type ConsequenceStep = {
  label: string;
  detail: string;
  triggeredIn: string;
};

export const consequenceChain: ConsequenceStep[] = [
  { label: "Payment overdue", detail: "Partner Y overhead payment 3 days past due", triggeredIn: "Now" },
  { label: "Default notice", detail: "Article 9.4 — formal default notice may be issued", triggeredIn: "Day 10" },
  { label: "Cure period", detail: "Partner Y has a final window to pay before consequences escalate", triggeredIn: "Day 20" },
  { label: "Forfeiture risk", detail: "Article 9.6 — uncured default can trigger forfeiture of participating interest", triggeredIn: "Day 30" },
];

// --- Cross-contract conflict map (feature 8) ---
export type ConflictCell = {
  contractA: string;
  contractB: string;
  clauseType: string;
  severity: "high" | "medium" | "low";
  note: string;
};

export const conflictMatrix: ConflictCell[] = [
  { contractA: "JOA — Block A", contractB: "PSC — Block B", clauseType: "Non-consent notice window", severity: "high", note: "10 days vs. 5 days — using the stricter 5-day rule" },
  { contractA: "JOA — Block A", contractB: "JOA — Block C", clauseType: "Overhead rate cap", severity: "medium", note: "3.0% vs. 3.4% — flagged for review" },
  { contractA: "PSC — Block B", contractB: "JOA — Block C", clauseType: "Decommissioning trigger", severity: "low", note: "Consistent across both — no action needed" },
];

// --- Presence (feature 5) ---
export type PresenceInfo = {
  itemId: string;
  viewer: string;
  when: string;
};

export const presence: PresenceInfo[] = [
  { itemId: "d1", viewer: "Chidi (Manager)", when: "2 min ago" },
  { itemId: "d2", viewer: "Amara (Employee)", when: "just now" },
];

// --- Personalized ranked queue (feature 10) ---
export function rankObligations(items: Obligation[]): (Obligation & { priorityScore: number })[] {
  const severityWeight = { high: 50, medium: 25, low: 10 };
  return items
    .map((o) => ({
      ...o,
      priorityScore: Math.round(severityWeight[o.severity] + Math.max(0, 60 - o.dueInDays)),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

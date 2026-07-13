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

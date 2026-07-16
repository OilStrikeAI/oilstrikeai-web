// Lets any component (a finding card, a document page) ask the floating
// AI chat widget to open and immediately ask a specific question — without
// threading state through the whole component tree, since the widget is
// mounted once at the dashboard layout level, far from where findings render.
export const OPEN_CHAT_EVENT = "oilstrike-open-chat";

export type ChatDiscrepancyContext = { discrepancyId: string; title: string; description?: string };

export function openChatWithQuestion(question: string, context?: ChatDiscrepancyContext) {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { question, context } }));
}

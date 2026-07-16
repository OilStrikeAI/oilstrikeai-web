// AI-assessed task completion — reads only what the assignee actually wrote
// in their progress note (never the task title alone) and estimates how far
// along the task is. This is a visibility aid for managers/directors, not a
// performance grade, so the UI must always label it as an AI estimate.
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const ESTIMATE_TOOL = {
  name: "record_completion_estimate",
  description: "Records an estimated completion percentage for a task, based on the assignee's own progress note.",
  input_schema: {
    type: "object" as const,
    properties: {
      percent: {
        type: "integer" as const,
        minimum: 0,
        maximum: 100,
        description: "Estimated percent complete, 0-100, based only on what the note actually describes.",
      },
      rationale: {
        type: "string" as const,
        description: "One short sentence explaining the estimate, referencing what the note said.",
      },
    },
    required: ["percent", "rationale"],
  },
};

export async function estimateTaskCompletion(params: {
  taskTitle: string;
  taskDescription: string | null;
  note: string;
  hadAttachment: boolean;
}): Promise<{ percent: number; rationale: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const system = `You estimate how complete a work task is, based only on the assignee's own progress note — never assume more progress than the note actually describes. A vague note ("working on it") should get a low-to-moderate estimate; a note describing a finished, verifiable action ("sent the signed LC to the bank") should get a high estimate. If the note explicitly says the task is done, use 100.`;

  const user = `Task: "${params.taskTitle}"
${params.taskDescription ? `Task description: ${params.taskDescription}\n` : ""}Assignee's progress note: "${params.note}"
${params.hadAttachment ? "The assignee also attached a file as supporting evidence of this work." : ""}`;

  const RETRYABLE_STATUSES = new Set([429, 500, 503, 529]);
  const MAX_ATTEMPTS = 2;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0,
        system,
        messages: [{ role: "user", content: user }],
        tools: [ESTIMATE_TOOL],
        tool_choice: { type: "tool", name: "record_completion_estimate" },
      }),
    });

    if (!response.ok) {
      if (attempt < MAX_ATTEMPTS && RETRYABLE_STATUSES.has(response.status)) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      console.error(`[taskCompletion] Anthropic API error ${response.status}`);
      return null;
    }

    const data = await response.json();
    const toolUse = (data.content as Array<Record<string, unknown>>)?.find((b) => b.type === "tool_use");
    const input = toolUse?.input as { percent?: number; rationale?: string } | undefined;
    if (typeof input?.percent !== "number" || typeof input?.rationale !== "string") return null;

    return { percent: Math.max(0, Math.min(100, Math.round(input.percent))), rationale: input.rationale };
  }

  return null;
}

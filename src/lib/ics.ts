"use client";

// Generates a minimal, valid .ics file client-side for a single deadline —
// works as an "Add to Calendar" action for Google Calendar, Apple Calendar,
// and Outlook alike, with no OAuth or account-linking required. Full
// two-way calendar sync is a bigger lift (per-user OAuth app) that isn't
// built yet; this is the low-friction version of the same feature.
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function downloadObligationIcs(params: { title: string; dueDate: string; description?: string }) {
  const dateOnly = params.dueDate.slice(0, 10).replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `${dateOnly}-${Math.random().toString(36).slice(2, 10)}@oilstrikeai.com`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OilStrikeAI//Deadlines//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dateOnly}`,
    `SUMMARY:${escapeIcsText(params.title)}`,
    params.description ? `DESCRIPTION:${escapeIcsText(params.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${params.title.slice(0, 40).replace(/[^a-z0-9]+/gi, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

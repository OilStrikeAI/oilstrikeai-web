"use client";

import { useEffect, useState } from "react";

// Same narration used on the free audit tool's full-screen "Analyzing..."
// step — reused here for the compact in-dashboard upload indicator so both
// experiences feel consistent.
export const ANALYZING_NARRATION = [
  "Reading your document page by page...",
  "Identifying parties, dates, and contract type...",
  "Cross-referencing clauses against billing terms...",
  "Checking for cost splits, overhead caps, and penalty math...",
  "Extracting deadlines and recurring obligations...",
  "Re-reading once more to verify every figure and citation...",
];

export function useAnalyzingProgress(active: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      // Resetting the visible counters when a new upload starts (active
      // flips back to true) — a deliberate one-shot reset tied to the
      // `active` prop change, not a reaction to state this effect owns.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsedSeconds(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLineIndex(0);
      return;
    }
    const secondsTimer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    const lineTimer = setInterval(() => {
      setLineIndex((i) => (i + 1 < ANALYZING_NARRATION.length ? i + 1 : i));
    }, 2200);
    return () => {
      clearInterval(secondsTimer);
      clearInterval(lineTimer);
    };
  }, [active]);

  return { elapsedSeconds, line: ANALYZING_NARRATION[lineIndex] };
}

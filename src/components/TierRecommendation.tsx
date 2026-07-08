"use client";

import { useSyncExternalStore } from "react";
import { tierFromSizing, type SizingAnswers } from "@/lib/mockData";

function subscribe() {
  // sessionStorage doesn't change during this component's lifetime for our
  // purposes, so there's nothing to subscribe to — just satisfy the API.
  return () => {};
}

function getSnapshot() {
  try {
    return window.sessionStorage.getItem("oilstrike_sizing");
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

export default function TierRecommendation() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const answers: SizingAnswers | null = raw ? JSON.parse(raw) : null;
  const tier = tierFromSizing(answers);

  return (
    <p className="mt-3 text-xs text-white/40">
      {tier.name}: {tier.price}
      {tier.period}, based on your answers
    </p>
  );
}

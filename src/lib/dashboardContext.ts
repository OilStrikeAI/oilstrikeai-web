"use client";

import { createContext, useContext } from "react";

export type Role = "director" | "manager" | "employee";

export type DashboardSummary = {
  score: number;
  totalRecovered: number;
  openItems: number;
  documentsAnalyzed: number;
  subscriptionStatus: string;
  role: Role;
  fullName: string | null;
  tier: string;
  companyName: string;
};

export const DashboardSummaryContext = createContext<{
  summary: DashboardSummary | null;
  error: string | null;
}>({ summary: null, error: null });

export function useDashboardSummary() {
  return useContext(DashboardSummaryContext);
}

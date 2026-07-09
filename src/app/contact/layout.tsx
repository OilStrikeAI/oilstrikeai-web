import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — OilStrikeAI",
  description: "Questions about a finding, your account, or anything else — reach the OilStrikeAI team directly.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

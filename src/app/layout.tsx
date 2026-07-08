import type { Metadata } from "next";
import { Fraunces, Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const body = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oilstrikeai.com"),
  title: {
    default: "OilStrikeAI — Never Miss a Dollar or a Deadline",
    template: "%s",
  },
  description:
    "AI that reads your PSC/JOA once and reconciles every JIB statement against it — catching overbilling and tracking every obligation, cited to source.",
  openGraph: {
    title: "OilStrikeAI — Never Miss a Dollar or a Deadline",
    description:
      "AI that reads your PSC/JOA once and reconciles every JIB statement against it — catching overbilling and tracking every obligation, cited to source.",
    siteName: "OilStrikeAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OilStrikeAI — Never Miss a Dollar or a Deadline",
    description:
      "AI that reads your PSC/JOA once and reconciles every JIB statement against it.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium ships its Chromium binary as large .br files under
  // bin/, loaded dynamically at runtime (not via a static import), so
  // Next.js's file tracing misses them unless explicitly included — without
  // this, the PDF routes 500 on Vercel with "input directory ... does not
  // exist" even though everything works locally.
  outputFileTracingIncludes: {
    "/api/audit/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/audit/[id]/email-pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;

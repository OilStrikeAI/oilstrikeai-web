import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both are already on Next.js's built-in externals list, but Turbopack
  // wasn't honoring that implicitly — bundling @sparticuz/chromium relocated
  // it and broke its __dirname-relative lookup of its own bin/ folder
  // ("must externalize @sparticuz/chromium so it is not relocated").
  // Declaring it explicitly forces native `require` instead of bundling.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // @sparticuz/chromium ships its Chromium binary as large .br files under
  // bin/, loaded dynamically at runtime (not via a static import), so
  // Next.js's file tracing misses them unless explicitly included — without
  // this, the PDF routes 500 on Vercel with "input directory ... does not
  // exist" even though everything works locally.
  // Keys are glob patterns, so the literal "[id]" in the route path must be
  // escaped — otherwise picomatch reads it as a one-character character
  // class instead of a literal route segment, and the include silently never
  // matches (this was the actual reason the first attempt at this fix did nothing).
  outputFileTracingIncludes: {
    "/api/audit/\\[id\\]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/audit/\\[id\\]/email-pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;

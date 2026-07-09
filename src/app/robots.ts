import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/onboarding",
          "/login",
          "/admin",
          "/api",
          "/create-account",
          "/auth",
        ],
      },
    ],
    sitemap: "https://oilstrikeai.com/sitemap.xml",
  };
}

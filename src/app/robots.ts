import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://traveloop.my";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, transactional or placeholder routes — nothing here belongs in
      // a search index, and /api serves attachments and JSON, not pages.
      disallow: ["/account", "/admin", "/api", "/passes/register", "/passes/success"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

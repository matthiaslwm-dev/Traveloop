import type { MetadataRoute } from "next";
import { blogPosts } from "./data/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://traveloop.my";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/passes`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/partners`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/blogs`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Only posts with body content have a readable article page.
  const articles: MetadataRoute.Sitemap = blogPosts
    .filter((post) => post.body)
    .map((post) => ({
      url: `${SITE_URL}/blogs/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  return [...staticRoutes, ...articles];
}

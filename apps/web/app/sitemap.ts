import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { COMPETITORS } from "@/lib/compare-data";
import { SOLUTIONS } from "@/lib/solutions-data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/works`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/free-kits`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/sandbox`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/templates/coaching-agreement-template`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/templates/discovery-questions-library`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/templates/client-checkin-framework`, changeFrequency: "monthly", priority: 0.7 },
    // Focus-tier standalone + feature + roundup pages (Section 8b + Section 2 keyword list).
    { url: `${SITE_URL}/ai-coaching-software`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/client-management-software`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/coaching-crm`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/client-portal`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/coaching-automation`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/features/client-dashboard`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/features/coaching-dashboard`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/best-coaching-software-solo-coaches`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/best-all-in-one-coaching-platform`, changeFrequency: "monthly", priority: 0.8 },
    // Linkable-asset calculators (Section 4b) — free, no-signup tools built
    // specifically to attract backlinks from coaching blogs/newsletters.
    { url: `${SITE_URL}/tools/capacity-calculator`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/tools/revenue-calculator`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/tools/churn-calculator`, changeFrequency: "monthly", priority: 0.7 },
    // Free downloadable template landing pages (Section 0d).
    { url: `${SITE_URL}/templates/client-tracker`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/templates/coaching-spreadsheet`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/templates/pt-client-tracker`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/templates/client-dashboard`, changeFrequency: "monthly", priority: 0.7 },
    // /login, /invite, /onboarding deliberately excluded — they're disallowed
    // in robots.ts (private/utility routes with no unique indexable content),
    // and listing a disallowed URL in the sitemap is a contradiction crawlers
    // (and Search Console) flag as an error.
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const compareRoutes: MetadataRoute.Sitemap = COMPETITORS.map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const solutionRoutes: MetadataRoute.Sitemap = SOLUTIONS.map((s) => ({
    url: `${SITE_URL}/solutions/${s.value}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes, ...compareRoutes, ...solutionRoutes];
}

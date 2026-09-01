import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// AI crawlers are named explicitly (not just covered by the wildcard rule)
// because crawler access is a binary GEO requirement, not an optimization —
// if a crawler can't fetch a page, that page can never be cited by the
// answer engine it belongs to, full stop. A CDN/WAF sitting in front of the
// real deployed domain should also be checked separately for silently
// blocking these at the firewall level even when robots.txt looks correct.
const AI_CRAWLER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      ...AI_CRAWLER_AGENTS.map((userAgent) => ({ userAgent, allow: "/" })),
      {
        userAgent: "*",
        allow: "/",
        // /signup is deliberately crawlable (real commercial intent, listed
        // in the sitemap) — only truly private/utility routes are blocked.
        disallow: ["/login", "/invite", "/onboarding"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

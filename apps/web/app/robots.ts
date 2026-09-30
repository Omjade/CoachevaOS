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

// /admin is the private owner-only dashboard — must never be crawled or
// indexed by ANY bot, so it's listed on every user-agent block below, not
// just the catch-all (a bot with its own explicit block ignores "*" rules
// entirely, so omitting it there would leave Googlebot/Bingbot/AI crawlers
// free to crawl it even though the catch-all disallows it for everyone
// else). Page-level noindex metadata on /admin itself is the second layer —
// robots.txt only asks compliant crawlers not to fetch it.
const PRIVATE_PATHS = ["/admin"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Bingbot", allow: "/", disallow: PRIVATE_PATHS },
      ...AI_CRAWLER_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE_PATHS })),
      {
        userAgent: "*",
        allow: "/",
        // /signup is deliberately crawlable (real commercial intent, listed
        // in the sitemap) — only truly private/utility routes are blocked.
        disallow: ["/login", "/invite", "/onboarding", ...PRIVATE_PATHS],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

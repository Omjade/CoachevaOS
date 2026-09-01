// Single source of truth for the site's canonical public URL — used by
// sitemap.ts, robots.ts, root metadata (metadataBase/OG/Twitter), and any
// JSON-LD structured data. "coachevaos.com" is the intended real domain per
// branding decisions but isn't registered/live yet — update
// NEXT_PUBLIC_SITE_URL once it is, and every consumer picks it up automatically.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://coachevaos.com";

export const SITE_NAME = "CoachevaOS";

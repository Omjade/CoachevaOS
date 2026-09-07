// Single source of truth for the site's canonical public URL — used by
// sitemap.ts, robots.ts, root metadata (metadataBase/OG/Twitter), and any
// JSON-LD structured data. Must be "www" — the live site 308-redirects both
// "https://coachevaos.com" (no www) and any http:// variant to
// "https://www.coachevaos.com", so that's the only URL that actually serves
// a 200. Every canonical/sitemap/OG URL previously pointed at the non-www
// redirect target instead of the real page, which is exactly what caused
// Search Console's "Page with redirect" indexing errors — Google was being
// told the canonical URL was one that immediately redirects elsewhere.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.coachevaos.com";

export const SITE_NAME = "CoachevaOS";

import type { MetadataRoute } from "next";

const BASE_URL = "https://coacheva.os";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/signup", "/invite", "/onboarding"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

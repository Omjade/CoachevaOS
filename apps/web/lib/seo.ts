import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// One consistent metadata shape for every marketing/content page — title,
// description, canonical, Open Graph, and Twitter Card — instead of hand-
// repeating the same object shape across ~30 pages, which is exactly the
// kind of drift that produced the sitemap/OG gaps found earlier this session.
export function buildMetadata({
  title,
  description,
  path,
  ogImage,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  keywords?: string[];
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const images = [{ url: ogImage ?? "/opengraph-image", width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

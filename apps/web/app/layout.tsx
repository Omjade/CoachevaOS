import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import Analytics from "@/components/Analytics";
import MotionPreferences from "@/components/MotionPreferences";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const TITLE = "CoachevaOS: The operating system for coaches";
const DESCRIPTION =
  "Run the coaching practice your clients deserve from one calm dashboard. Client records, follow-ups, bookings, billing, and AI-guided coaching in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "coaching software",
    "coaching practice management software",
    "client management software for coaches",
    "AI coaching software",
    "coaching CRM",
    "coaching client portal",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Organization + SoftwareApplication JSON-LD — the single highest-leverage
// GEO addition: it gives search engines AND AI answer engines (which lean
// heavily on structured data to build their own summaries/citations) an
// unambiguous machine-readable definition of what CoachevaOS is, who makes
// it, and what it costs to start, rather than making them infer it from
// prose. Kept in the root layout so it's present on every page.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/opengraph-image`,
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: DESCRIPTION,
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        category: "SaaS subscription",
        url: `${SITE_URL}/pricing`,
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${urbanist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <MotionPreferences>{children}</MotionPreferences>
        <CookieConsent />
        <Analytics />
        {/* Google Preferred Sources — real, current Google mechanism (verified
            against Search Central docs) that surfaces a "preferred" badge on
            citations in Top Stories, AI Mode, and AI Overviews once a reader
            selects this site. Only root/subdomain sites qualify, and it only
            becomes active once the domain is live and recognized. */}
        <Script
          async
          src="https://news.google.com/swg/js/v1/publisher.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

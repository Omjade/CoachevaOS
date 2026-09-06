import { SITE_URL } from "@/lib/site";

// WebApplication + "free" Offer schema makes a calculator/template page
// eligible for rich results (price, ratingless free-tool badges) the way
// Breadcrumbs/FAQAccordion already do for their own schema types elsewhere
// in this codebase — same <script type="application/ld+json"> convention.
export default function ToolSchema({
  name,
  description,
  path,
  applicationCategory = "BusinessApplication",
}: {
  name: string;
  description: string;
  path: string;
  applicationCategory?: string;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: `${SITE_URL}${path}`,
    applicationCategory,
    operatingSystem: "Any (web-based)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

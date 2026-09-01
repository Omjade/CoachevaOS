import Link from "next/link";
import { CaretRightIcon as CaretRight } from "@phosphor-icons/react/dist/ssr";
import { SITE_URL } from "@/lib/site";

export interface Crumb {
  label: string;
  href?: string;
}

// Emits BreadcrumbList JSON-LD and a real, styled trail — used on every page
// below the homepage per the SEO playbook. `href` omitted on the last item
// (the current page) since it shouldn't link to itself.
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-neutral-500">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <CaretRight className="h-3 w-3 text-neutral-300" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-accent-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

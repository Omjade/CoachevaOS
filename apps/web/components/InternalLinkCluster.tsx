import Link from "next/link";
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

export interface RelatedLink {
  label: string;
  href: string;
}

// Hub-and-spoke internal linking — every cluster post links up to its pillar
// and sideways to related content, every solution/compare page links down to
// what it should convert into. This is a direct ranking signal, not
// decoration: don't publish a new page without wiring this in.
export default function InternalLinkCluster({
  title = "Related",
  links,
}: {
  title?: string;
  links: RelatedLink[];
}) {
  if (links.length === 0) return null;
  return (
    <div className="mt-10 border-t border-neutral-200 pt-8">
      <h3 className="font-heading mb-4 text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="flex flex-col gap-2.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
          >
            {link.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

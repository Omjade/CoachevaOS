import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Card, Eyebrow, Button } from "@/components/ui";

const HELPFUL_LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
];

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-3 py-16 text-center md:px-4">
        <Eyebrow className="mb-4">404</Eyebrow>
        <h1 className="font-heading mb-3 text-[30px] font-semibold tracking-tight text-neutral-900 md:text-[36px]">
          This page doesn&apos;t exist
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-neutral-600">
          The link you followed may be broken, or the page may have moved. Here are a few places
          to pick back up.
        </p>
        <Card className="w-full">
          <div className="flex flex-col gap-2">
            {HELPFUL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[10px] px-3 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </Card>
        <Link href="/" className="mt-8">
          <Button>Back to homepage</Button>
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

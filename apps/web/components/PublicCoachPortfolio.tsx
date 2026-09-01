"use client";

import { useEffect, useState } from "react";
import {
  GlobeIcon as Globe,
  InstagramLogoIcon as InstagramLogo,
  LinkedinLogoIcon as LinkedinLogo,
} from "@phosphor-icons/react";
import { api, PortalPublic, ProgramTemplate } from "@/lib/api";
import { Card, Eyebrow } from "@/components/ui";
import { nicheDisplayLabel } from "@/lib/niche";

// The truly public, no-login-required equivalent of AboutCoachCard — a real
// standalone page (not an embedded card) at a coach's own /{slug}, meant to
// be shared with prospective clients. Onboarding here is invite-only (this
// app has no public self-serve signup), so the closing CTA points visitors
// at the coach's own contact channels rather than a fabricated signup form.
export default function PublicCoachPortfolio({ slug }: { slug: string }) {
  const [portal, setPortal] = useState<PortalPublic | "not_found" | null>(null);
  const [packages, setPackages] = useState<ProgramTemplate[]>([]);

  useEffect(() => {
    api
      .portalBySlug(slug)
      .then(setPortal)
      .catch(() => setPortal("not_found"));
    api.getPublicPackages(slug).then(setPackages).catch(() => {});
  }, [slug]);

  if (portal === null) return null;

  if (portal === "not_found") {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-100 px-6 py-16">
        <Card className="w-full max-w-sm text-center">
          <p className="text-sm text-neutral-600">No coach found at coachevaos.com/{slug}</p>
        </Card>
      </div>
    );
  }

  const links: { href: string; label: string; Icon: typeof Globe }[] = [];
  if (portal.website_url) links.push({ href: portal.website_url, label: "Website", Icon: Globe });
  if (portal.instagram_url)
    links.push({ href: portal.instagram_url, label: "Instagram", Icon: InstagramLogo });
  if (portal.linkedin_url) links.push({ href: portal.linkedin_url, label: "LinkedIn", Icon: LinkedinLogo });

  const gallery = portal.gallery_image_urls ?? [];
  const displayName = portal.business_name ?? portal.coach_name;

  return (
    <div className="flex flex-1 justify-center bg-neutral-100 px-6 py-16">
      <div className="w-full max-w-2xl">
        <Eyebrow className="mb-4">{nicheDisplayLabel(portal.niche)}</Eyebrow>
        <h1 className="font-heading mb-2 text-3xl font-semibold tracking-tight text-neutral-900">
          {displayName}
        </h1>
        {portal.coach_name !== displayName && (
          <p className="mb-6 text-sm text-neutral-500">{portal.coach_name}</p>
        )}

        {portal.bio && (
          <Card className="mb-6">
            <p className="text-sm leading-relaxed text-neutral-700">{portal.bio}</p>
            {links.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {links.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </a>
                ))}
              </div>
            )}
          </Card>
        )}

        {gallery.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((_key, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={api.galleryImageUrl(slug, i)}
                alt=""
                className="aspect-square w-full rounded-[14px] object-cover"
              />
            ))}
          </div>
        )}

        {packages.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
              Programs offered
            </h2>
            <div className="flex flex-col gap-3">
              {packages.map((p) => (
                <Card key={p.id}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900">{p.title}</h3>
                    {p.price_amount != null && (
                      <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
                        {p.price_currency ?? ""} {p.price_amount}
                        {p.billing_cadence && p.billing_cadence !== "one_time"
                          ? ` / ${p.billing_cadence}`
                          : ""}
                      </span>
                    )}
                  </div>
                  {p.description && <p className="text-sm text-neutral-600">{p.description}</p>}
                  {p.duration_weeks && (
                    <p className="mt-1 text-xs text-neutral-500">{p.duration_weeks}-week program</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="bg-neutral-900 text-center">
          <p className="text-sm text-white">
            Want to work with {portal.coach_name}? Reach out directly to get started.
          </p>
        </Card>
      </div>
    </div>
  );
}

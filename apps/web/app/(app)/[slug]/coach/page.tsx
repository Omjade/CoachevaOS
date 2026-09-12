"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  GlobeIcon as Globe,
  InstagramLogoIcon as InstagramLogo,
  LinkedinLogoIcon as LinkedinLogo,
} from "@phosphor-icons/react";
import { api, PortalPublic, ProgramTemplate } from "@/lib/api";
import { Card, Eyebrow } from "@/components/ui";
import { useRoleGuard } from "@/lib/useRoleGuard";
import FullScreenLoader from "@/components/FullScreenLoader";

// The full-page version of AboutCoachCard's content — that card only ever
// shows on the dashboard and hides itself entirely when there's nothing to
// show; this gives it a real, standalone destination reachable from the nav.
export default function KnowYourCoachPage() {
  const ok = useRoleGuard("client");
  const params = useParams<{ slug: string }>();
  const [portal, setPortal] = useState<PortalPublic | null>(null);
  const [packages, setPackages] = useState<ProgramTemplate[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!ok) return;
    api
      .portalBySlug(params.slug)
      .then(setPortal)
      .catch(() => setLoadError(true));
    api.getPublicPackages(params.slug).then(setPackages).catch(() => {});
  }, [ok, params.slug]);

  if (!ok) return null;

  if (loadError) {
    return (
      <Card>
        <p className="text-sm text-neutral-600">
          Couldn&apos;t load your coach&apos;s profile.{" "}
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              api.portalBySlug(params.slug).then(setPortal).catch(() => setLoadError(true));
            }}
            className="font-medium text-accent-600 hover:underline"
          >
            Try again
          </button>
          .
        </p>
      </Card>
    );
  }

  if (!portal) return <FullScreenLoader fill />;

  const links: { href: string; label: string; Icon: typeof Globe }[] = [];
  if (portal.website_url) links.push({ href: portal.website_url, label: "Website", Icon: Globe });
  if (portal.instagram_url)
    links.push({ href: portal.instagram_url, label: "Instagram", Icon: InstagramLogo });
  if (portal.linkedin_url) links.push({ href: portal.linkedin_url, label: "LinkedIn", Icon: LinkedinLogo });
  const gallery = portal.gallery_image_urls ?? [];

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        {portal.logo_url && (
          <div className="mb-4 h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={api.coachLogoUrl(params.slug)} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <Eyebrow className="mb-2">Know your coach</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          {portal.business_name ?? portal.coach_name}
        </h1>
        {portal.coach_name !== (portal.business_name ?? portal.coach_name) && (
          <p className="mt-1 text-sm text-neutral-500">{portal.coach_name}</p>
        )}
      </div>

      {!portal.bio && !gallery.length && links.length === 0 && packages.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            {portal.coach_name} hasn&apos;t added a bio or links yet.
          </p>
        </Card>
      ) : (
        <>
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
                  src={api.galleryImageUrl(params.slug, i)}
                  alt=""
                  className="aspect-square w-full rounded-[14px] object-cover"
                />
              ))}
            </div>
          )}

          {packages.length > 0 && (
            <div>
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
        </>
      )}
    </div>
  );
}

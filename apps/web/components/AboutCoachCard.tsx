"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  GlobeIcon as Globe,
  InstagramLogoIcon as InstagramLogo,
  LinkedinLogoIcon as LinkedinLogo,
} from "@phosphor-icons/react";
import { api, PortalPublic } from "@/lib/api";
import { Card } from "@/components/ui";

export default function AboutCoachCard() {
  const params = useParams<{ slug: string }>();
  const [portal, setPortal] = useState<PortalPublic | null>(null);

  useEffect(() => {
    api.portalBySlug(params.slug).then(setPortal).catch(() => {});
  }, [params.slug]);

  // No bio and no links to show yet — the coach hasn't filled this in, don't
  // show an empty "About your coach" section.
  if (!portal || (!portal.bio && !portal.website_url && !portal.instagram_url && !portal.linkedin_url)) {
    return null;
  }

  const links: { href: string; label: string; Icon: typeof Globe }[] = [];
  if (portal.website_url) links.push({ href: portal.website_url, label: "Website", Icon: Globe });
  if (portal.instagram_url) links.push({ href: portal.instagram_url, label: "Instagram", Icon: InstagramLogo });
  if (portal.linkedin_url) links.push({ href: portal.linkedin_url, label: "LinkedIn", Icon: LinkedinLogo });

  return (
    <Card>
      <h3 className="font-heading mb-3 text-sm font-semibold text-neutral-900">About your coach</h3>
      <p className="mb-2 text-sm font-medium text-neutral-900">
        {portal.business_name ?? portal.coach_name}
      </p>
      {portal.bio && <p className="mb-3 text-sm text-neutral-600">{portal.bio}</p>}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
  );
}

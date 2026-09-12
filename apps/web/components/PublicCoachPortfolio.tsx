"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GlobeIcon as Globe,
  InstagramLogoIcon as InstagramLogo,
  LinkedinLogoIcon as LinkedinLogo,
  ArrowSquareOutIcon as ArrowSquareOut,
  QuotesIcon as Quotes,
} from "@phosphor-icons/react";
import { api, ApiError, PortalPublic, ProgramTemplate } from "@/lib/api";
import { Card, Eyebrow, Button, Input, Label } from "@/components/ui";
import { nicheDisplayLabel } from "@/lib/niche";
import Avatar from "@/components/Avatar";

function ContactCard({ slug, coachName }: { slug: string; coachName: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.submitPortalContact(slug, {
        name,
        email,
        phone: phone || undefined,
        message: message || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send that. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card className="bg-neutral-900 text-center">
        <p className="text-sm text-white">
          Thanks, {name.split(" ")[0]}. {coachName} will be in touch.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-neutral-900">
      <p className="mb-4 text-sm text-white">
        Want to work with {coachName}? Get in touch to get started.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <Label htmlFor="contact-name" className="text-neutral-300!">
            Your name
          </Label>
          <Input
            id="contact-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-white/15! bg-white/5! text-white placeholder:text-neutral-500 focus:border-accent-500! focus:ring-0!"
          />
        </div>
        <div>
          <Label htmlFor="contact-email" className="text-neutral-300!">
            Email
          </Label>
          <Input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-white/15! bg-white/5! text-white placeholder:text-neutral-500 focus:border-accent-500! focus:ring-0!"
          />
        </div>
        <div>
          <Label htmlFor="contact-phone" className="text-neutral-300!">
            Phone (optional)
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border-white/15! bg-white/5! text-white placeholder:text-neutral-500 focus:border-accent-500! focus:ring-0!"
          />
        </div>
        <div>
          <Label htmlFor="contact-message" className="text-neutral-300!">
            Message (optional)
          </Label>
          <textarea
            id="contact-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-none rounded-(--radius-sm) border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-accent-500"
          />
        </div>
        {error && <p className="text-xs text-accent-400">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Sending…" : "Get in touch"}
        </Button>
      </form>
    </Card>
  );
}

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

  const socialLinks: { href: string; label: string; Icon: typeof Globe }[] = [];
  if (portal.website_url) socialLinks.push({ href: portal.website_url, label: "Website", Icon: Globe });
  if (portal.instagram_url)
    socialLinks.push({ href: portal.instagram_url, label: "Instagram", Icon: InstagramLogo });
  if (portal.linkedin_url) socialLinks.push({ href: portal.linkedin_url, label: "LinkedIn", Icon: LinkedinLogo });

  const gallery = portal.gallery_image_urls ?? [];
  const displayName = portal.business_name ?? portal.coach_name;
  const customLinks = portal.custom_links ?? [];
  const testimonials = portal.testimonials ?? [];

  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      {/* Full-bleed banner, edge to edge — falls back to a plain brand-tinted
          strip when the coach hasn't uploaded one, so the layout never looks
          broken/empty for a coach who skipped this step. */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-700 sm:h-56">
        {portal.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={api.coachBannerUrl(slug)} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex flex-1 justify-center px-6 pb-16">
        <div className="w-full max-w-2xl">
          {/* The coach's own personal photo — deliberately separate from
              logo_url (a business/brand mark that also replaces the
              CoachevaOS mark in the coach's own sidebar). Uploading one must
              never change the other. Pulled up over the banner, classic
              profile-page overlap. */}
          <div className="-mt-12 mb-4 flex items-end justify-between sm:-mt-16">
            <Avatar
              userId={portal.coach_user_id}
              name={portal.coach_name}
              className="h-24 w-24 border-4 border-neutral-100 text-3xl shadow-lg sm:h-32 sm:w-32"
            />
            {portal.logo_url && (
              <div className="mb-1 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-neutral-100 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={api.coachLogoUrl(slug)} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <Eyebrow className="mb-3">{nicheDisplayLabel(portal.niche)}</Eyebrow>
          <h1 className="font-heading mb-1 text-3xl font-semibold tracking-tight text-neutral-900">
            {displayName}
          </h1>
          {portal.coach_name !== displayName && (
            <p className="mb-2 text-sm text-neutral-500">{portal.coach_name}</p>
          )}
          {portal.tagline && (
            <p className="mb-5 max-w-lg text-base leading-snug text-neutral-600">{portal.tagline}</p>
          )}

          {socialLinks.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-[0_4px_10px_rgba(28,29,31,0.08)] transition-colors duration-200 hover:bg-neutral-900 hover:text-white"
                >
                  <Icon className="h-4.5 w-4.5" weight="fill" />
                </a>
              ))}
            </div>
          )}

          {portal.bio && (
            <Card className="mb-6">
              <p className="text-sm leading-relaxed text-neutral-700">{portal.bio}</p>
            </Card>
          )}

          {testimonials.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {testimonials.map((t, i) => (
                <Card key={i} className="!p-4">
                  <Quotes className="mb-2 h-5 w-5 text-accent-300" weight="fill" />
                  <p className="mb-3 text-sm leading-relaxed text-neutral-700">{t.quote}</p>
                  <p className="text-xs font-medium text-neutral-500">{t.author}</p>
                </Card>
              ))}
            </div>
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

          {customLinks.length > 0 && (
            <div className="mb-6 flex flex-col gap-2.5">
              {customLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {link.label}
                  <ArrowSquareOut className="h-4 w-4 text-neutral-400" />
                </a>
              ))}
            </div>
          )}

          {portal.featured_form_slug ? (
            <Card className="bg-neutral-900 text-center">
              <p className="mb-4 text-sm text-white">
                Want to work with {portal.coach_name}? Get started below.
              </p>
              <Link href={`/${slug}/${portal.featured_form_slug}`}>
                <Button className="w-full">Get in touch</Button>
              </Link>
            </Card>
          ) : (
            <ContactCard slug={slug} coachName={portal.coach_name} />
          )}
        </div>
      </div>
    </div>
  );
}

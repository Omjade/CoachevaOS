"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarbellIcon as Barbell,
  AppleLogoIcon as AppleLogo,
  BriefcaseIcon as Briefcase,
  CompassIcon as Compass,
  HeartIcon as Heart,
  UsersThreeIcon as UsersThree,
  HeartbeatIcon as Heartbeat,
  BrainIcon as Brain,
  GraduationCapIcon as GraduationCap,
  SoccerBallIcon as SoccerBall,
  BabyIcon as Baby,
  CurrencyDollarIcon as CurrencyDollar,
  DotsThreeIcon as DotsThree,
  CopySimpleIcon as CopySimple,
  CheckIcon as Check,
  CameraIcon as Camera,
  CreditCardIcon as CreditCard,
  SignOutIcon as SignOut,
  TrashIcon as Trash,
  CircleNotchIcon as CircleNotch,
} from "@phosphor-icons/react";
import { api, ApiError, ClientSelfProfile, CoachProfile, User } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";
import { listTimezones, timezoneLabel } from "@/lib/timezones";
import { performLogout } from "@/lib/logout";
import { Button, Card, ErrorBanner, Eyebrow, Input, Label } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";
import { useSubscription } from "@/lib/useSubscription";
import { useCurrentUser } from "@/lib/useCurrentUser";
import Avatar from "@/components/Avatar";
import SecurityPrivacyCard from "@/components/SecurityPrivacyCard";
import AssistantSettingsCard from "@/components/AssistantSettingsCard";
import AutomationSettingsCard from "@/components/AutomationSettingsCard";

const TIMEZONES = listTimezones();

const CLIENT_STATUS_LABEL: Record<ClientSelfProfile["status"], string> = {
  active: "Active",
  at_risk: "At risk",
  paused: "Paused",
  churned: "Churned",
  deleted: "Deleted",
};

const NICHES = [
  { value: "fitness", label: "Fitness & personal training", Icon: Barbell },
  { value: "nutrition", label: "Health & nutrition", Icon: AppleLogo },
  { value: "business", label: "Business & entrepreneurship", Icon: Briefcase },
  { value: "career", label: "Career & job search", Icon: Compass },
  { value: "life", label: "Life coaching", Icon: Heart },
  { value: "executive", label: "Executive & leadership", Icon: UsersThree },
  { value: "relationship", label: "Relationship & dating", Icon: Heartbeat },
  { value: "mindset", label: "Mindset & wellness", Icon: Brain },
  { value: "academic", label: "Academic & study skills", Icon: GraduationCap },
  { value: "sports", label: "Sports performance", Icon: SoccerBall },
  { value: "parenting", label: "Parenting & family", Icon: Baby },
  { value: "financial", label: "Financial coaching", Icon: CurrencyDollar },
  { value: "other", label: "Other", Icon: DotsThree },
] as const;

const NICHE_VALUES: readonly string[] = NICHES.map((n) => n.value);

export default function SettingsPage() {
  const role = useViewerRole();
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    if (role !== "client") return;
    api
      .getMyClientProfile()
      .then((p) => router.replace(`/${params.slug}/client/${p.id}/settings`))
      .catch(() => {});
  }, [role, router, params.slug]);

  if (role === null) return null;
  if (role === "client") return null; // redirecting via the effect above
  return <CoachSettings />;
}

function CoachSettings() {
  const params = useParams<{ slug: string }>();
  const { subscription } = useSubscription();
  const { user: cachedUser } = useCurrentUser();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const userId = user?.id ?? null;
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState<(typeof NICHES)[number]["value"] | "">("");
  const [otherNiche, setOtherNiche] = useState("");
  const [timezone, setTimezone] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [customLinks, setCustomLinks] = useState<{ label: string; url: string }[]>([]);
  const [testimonials, setTestimonials] = useState<{ quote: string; author: string }[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Account & billing settings save independently from the public-profile
  // form above them — two distinct actions, each scoped to its own section,
  // rather than one shared "Save changes" covering unrelated fields.
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cachedUser) setUser(cachedUser);
  }, [cachedUser]);

  useEffect(() => {
    api
      .myProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name);
        setBusinessName(p.business_name ?? "");
        if (p.niche && !NICHE_VALUES.includes(p.niche)) {
          setNiche("other");
          setOtherNiche(p.niche);
        } else {
          setNiche((p.niche as (typeof NICHES)[number]["value"]) ?? "");
        }
        setTimezone(p.timezone);
        setBillingCountry(p.billing_country_code ?? "");
        setCurrency(p.currency);
        setBio(p.bio ?? "");
        setWebsiteUrl(p.website_url ?? "");
        setInstagramUrl(p.instagram_url ?? "");
        setLinkedinUrl(p.linkedin_url ?? "");
        setTagline(p.tagline ?? "");
        setCustomLinks(p.custom_links ?? []);
        setTestimonials(p.testimonials ?? []);
      })
      .catch(() => {});
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setAvatarUploading(true);
    try {
      await api.uploadMyAvatar(file);
      setAvatarVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that photo. Try again.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateMyProfile({
        name,
        business_name: businessName || undefined,
        niche: (niche === "other" ? otherNiche : niche) || undefined,
        bio: bio || undefined,
        website_url: websiteUrl || undefined,
        instagram_url: instagramUrl || undefined,
        linkedin_url: linkedinUrl || undefined,
        tagline: tagline || undefined,
        custom_links: customLinks.filter((l) => l.label.trim() && l.url.trim()),
        testimonials: testimonials.filter((t) => t.quote.trim() && t.author.trim()),
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleAccountSettingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAccountError(null);
    setAccountSaving(true);
    try {
      const updated = await api.updateMyProfile({
        timezone,
        billing_country_code: billingCountry || undefined,
        currency,
      });
      setProfile(updated);
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 2000);
    } catch (err) {
      setAccountError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setAccountSaving(false);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryError(null);
    setGalleryUploading(true);
    try {
      const updated = await api.uploadGalleryImage(file);
      setProfile(updated);
    } catch (err) {
      setGalleryError(err instanceof ApiError ? err.message : "Couldn't upload that image. Try again.");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function removeGalleryImage(index: number) {
    setGalleryError(null);
    try {
      const updated = await api.removeGalleryImage(index);
      setProfile(updated);
    } catch (err) {
      setGalleryError(err instanceof ApiError ? err.message : "Couldn't remove that image. Try again.");
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const updated = await api.uploadLogo(file);
      setProfile(updated);
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : "Couldn't upload that logo. Try again.");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function removeLogo() {
    setLogoError(null);
    try {
      const updated = await api.removeLogo();
      setProfile(updated);
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : "Couldn't remove that logo. Try again.");
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerError(null);
    setBannerUploading(true);
    try {
      const updated = await api.uploadBanner(file);
      setProfile(updated);
    } catch (err) {
      setBannerError(err instanceof ApiError ? err.message : "Couldn't upload that banner. Try again.");
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  async function removeBanner() {
    setBannerError(null);
    try {
      const updated = await api.removeBanner();
      setProfile(updated);
    } catch (err) {
      setBannerError(err instanceof ApiError ? err.message : "Couldn't remove that banner. Try again.");
    }
  }

  async function copyPortalLink() {
    if (!profile) return;
    const url = `${window.location.origin}/${profile.portal_slug}`;
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!profile) return null;

  return (
    <div className="animate-fade-up mx-auto max-w-4xl">
      <div className="mb-6">
        <Eyebrow className="mb-2">Your profile</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          Coach profile
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          This is how you and your practice show up across CoachevaOS.
        </p>
      </div>

      <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative shrink-0 disabled:cursor-wait"
            aria-label="Change profile photo"
          >
            {userId && (
              <Avatar
                key={avatarVersion}
                userId={userId}
                name={name || "?"}
                className="h-16 w-16 text-2xl"
              />
            )}
            <span
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white transition-opacity ${
                avatarUploading ? "bg-black/40! opacity-100" : "opacity-0 group-hover:bg-black/40 group-hover:opacity-100"
              }`}
            >
              {avatarUploading ? (
                <CircleNotch className="h-5 w-5 animate-spin-slow" weight="bold" />
              ) : (
                <Camera className="h-5 w-5" weight="bold" />
              )}
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-neutral-900">{profile.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="truncate text-sm text-neutral-500">
                coachevaos.com/{profile.portal_slug}
              </span>
              <button
                type="button"
                onClick={copyPortalLink}
                className="flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" weight="bold" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopySimple className="h-3 w-3" weight="bold" />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="business_name">Business name</Label>
            <Input
              id="business_name"
              placeholder="e.g. Summit Coaching"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div>
            <Label>Coaching niche</Label>
            <div className="grid max-h-64 grid-cols-3 gap-2.5 overflow-y-auto pr-1">
              {NICHES.map(({ value, label, Icon }) => {
                const active = niche === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNiche(value)}
                    className={`flex flex-col items-center gap-2 rounded-[14px] border px-3 py-4 text-center text-xs font-medium transition-all duration-200 ${
                      active
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-md"
                        : "border-neutral-200 bg-neutral-50/60 text-neutral-600 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm"
                    }`}
                  >
                    <Icon
                      className="h-5 w-5"
                      weight={active ? "fill" : "regular"}
                      style={{ color: active ? "var(--color-accent-400)" : undefined }}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
            {niche === "other" && (
              <Input
                className="mt-2.5"
                placeholder="Tell us your niche"
                value={otherNiche}
                onChange={(e) => setOtherNiche(e.target.value)}
              />
            )}
          </div>

          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              maxLength={150}
              placeholder="e.g. Helping busy parents build sustainable fitness habits"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
            <p className="mt-1 text-right text-xs text-neutral-400">{tagline.length}/150</p>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              rows={3}
              maxLength={500}
              placeholder="Tell your clients a bit about your coaching approach…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full resize-none rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white"
            />
            <p className="mt-1 text-right text-xs text-neutral-400">{bio.length}/500</p>
          </div>

          <div>
            <Label htmlFor="website_url">Website</Label>
            <Input
              id="website_url"
              type="url"
              placeholder="https://yourwebsite.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="instagram_url">Instagram</Label>
            <Input
              id="instagram_url"
              type="url"
              placeholder="https://instagram.com/yourhandle"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="logo" className="mb-0">
                Your own logo
              </Label>
              <div className="flex items-center gap-3 text-xs font-medium">
                {profile.logo_url && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="text-neutral-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-1.5 text-accent-600 hover:underline disabled:cursor-wait disabled:opacity-50"
                >
                  {logoUploading && <CircleNotch className="h-3.5 w-3.5 animate-spin-slow" weight="bold" />}
                  {logoUploading ? "Uploading…" : profile.logo_url ? "Change logo" : "+ Add logo"}
                </button>
              </div>
              <input
                ref={logoInputRef}
                id="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <p className="mb-2 text-xs text-neutral-500">
              Replaces the CoachevaOS mark with your own in your portal and public profile.
            </p>
            {logoError && <p className="mb-2 text-xs text-accent-600">{logoError}</p>}
            {profile.logo_url && (
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={api.coachLogoUrl(profile.portal_slug)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {logoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <CircleNotch className="h-5 w-5 animate-spin-slow text-white" weight="bold" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="banner" className="mb-0">
                Public profile banner
              </Label>
              <div className="flex items-center gap-3 text-xs font-medium">
                {profile.banner_url && (
                  <button type="button" onClick={removeBanner} className="text-neutral-500 hover:underline">
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="flex items-center gap-1.5 text-accent-600 hover:underline disabled:cursor-wait disabled:opacity-50"
                >
                  {bannerUploading && <CircleNotch className="h-3.5 w-3.5 animate-spin-slow" weight="bold" />}
                  {bannerUploading ? "Uploading…" : profile.banner_url ? "Change banner" : "+ Add banner"}
                </button>
              </div>
              <input
                ref={bannerInputRef}
                id="banner"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerUpload}
              />
            </div>
            <p className="mb-2 text-xs text-neutral-500">
              A wide header image shown at the top of your public profile. Recommended: 1200×400 or
              wider.
            </p>
            {bannerError && <p className="mb-2 text-xs text-accent-600">{bannerError}</p>}
            {profile.banner_url && (
              <div className="relative aspect-[3/1] w-full overflow-hidden rounded-[12px] border border-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={api.coachBannerUrl(profile.portal_slug)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {bannerUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <CircleNotch className="h-6 w-6 animate-spin-slow text-white" weight="bold" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="gallery" className="mb-0">
                Photos ({(profile.gallery_image_urls ?? []).length}/6)
              </Label>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={galleryUploading || (profile.gallery_image_urls ?? []).length >= 6}
                className="flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:underline disabled:cursor-wait disabled:opacity-50"
              >
                {galleryUploading && <CircleNotch className="h-3.5 w-3.5 animate-spin-slow" weight="bold" />}
                {galleryUploading ? "Uploading…" : "+ Add photo"}
              </button>
              <input
                ref={galleryInputRef}
                id="gallery"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </div>
            {galleryError && <p className="mb-2 text-xs text-accent-600">{galleryError}</p>}
            {((profile.gallery_image_urls ?? []).length > 0 || galleryUploading) && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(profile.gallery_image_urls ?? []).map((_key, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-[10px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={api.galleryImageUrl(profile.portal_slug, i)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition-opacity group-hover:bg-black/50 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {galleryUploading && (
                  <div className="flex aspect-square items-center justify-center rounded-[10px] bg-neutral-100">
                    <CircleNotch className="h-5 w-5 animate-spin-slow text-neutral-400" weight="bold" />
                  </div>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-neutral-500">Shown on your public profile page.</p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Links (up to 6)</Label>
              {customLinks.length < 6 && (
                <button
                  type="button"
                  onClick={() => setCustomLinks((prev) => [...prev, { label: "", url: "" }])}
                  className="text-xs font-medium text-accent-600 hover:underline"
                >
                  + Add link
                </button>
              )}
            </div>
            <p className="mb-2 text-xs text-neutral-500">
              Extra buttons on your public profile — a Linktree-style list for anything not covered
              above (podcast, YouTube, a specific program page, etc).
            </p>
            <div className="flex flex-col gap-2">
              {customLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) =>
                      setCustomLinks((prev) => prev.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))
                    }
                    className="w-1/3"
                  />
                  <Input
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) =>
                      setCustomLinks((prev) => prev.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)))
                    }
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomLinks((prev) => prev.filter((_, j) => j !== i))}
                    className="text-neutral-400 hover:text-accent-600"
                    aria-label="Remove link"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Testimonials (up to 6)</Label>
              {testimonials.length < 6 && (
                <button
                  type="button"
                  onClick={() => setTestimonials((prev) => [...prev, { quote: "", author: "" }])}
                  className="text-xs font-medium text-accent-600 hover:underline"
                >
                  + Add testimonial
                </button>
              )}
            </div>
            <p className="mb-2 text-xs text-neutral-500">
              Social proof shown on your public profile — a short quote and who said it.
            </p>
            <div className="flex flex-col gap-3">
              {testimonials.map((t, i) => (
                <div key={i} className="rounded-[12px] bg-neutral-50/60 p-3">
                  <textarea
                    rows={2}
                    maxLength={400}
                    placeholder="Quote"
                    value={t.quote}
                    onChange={(e) =>
                      setTestimonials((prev) => prev.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)))
                    }
                    className="mb-2 w-full resize-none rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-accent-500"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Author, e.g. Priya N."
                      value={t.author}
                      onChange={(e) =>
                        setTestimonials((prev) => prev.map((x, j) => (j === i ? { ...x, author: e.target.value } : x)))
                      }
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setTestimonials((prev) => prev.filter((_, j) => j !== i))}
                      className="text-neutral-400 hover:text-accent-600"
                      aria-label="Remove testimonial"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-xs font-medium text-accent-600">
                <Check className="h-3.5 w-3.5" weight="bold" />
                Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      <div className="mt-8 mb-6">
        <Eyebrow className="mb-2">Account &amp; billing</Eyebrow>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-neutral-900">
          Account settings
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Your own operational settings — separate from what clients and visitors see on your
          public profile above.
        </p>
      </div>

      <Card>
        <form onSubmit={handleAccountSettingsSubmit} className="flex flex-col gap-5">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
            >
              {!TIMEZONES.includes(timezone) && timezone && (
                <option value={timezone}>{timezoneLabel(timezone)}</option>
              )}
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {timezoneLabel(tz)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="billing_country">Billing country</Label>
            <select
              id="billing_country"
              value={billingCountry}
              onChange={(e) => setBillingCountry(e.target.value)}
              className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
            >
              <option value="">Select a country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-neutral-500">
              Drives your CoachevaOS plan pricing. Changing this won&apos;t affect an active paid
              subscription. Contact support to move an existing subscription between currencies.
            </p>
          </div>

          <div>
            <Label htmlFor="currency">Client billing currency</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-neutral-500">
              Used everywhere you bill your own clients: invoices, dashboard amounts, and program
              pricing. Separate from your CoachevaOS plan pricing above.
            </p>
          </div>

          {accountError && <ErrorBanner>{accountError}</ErrorBanner>}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={accountSaving}>
              {accountSaving ? "Saving…" : "Save changes"}
            </Button>
            {accountSaved && (
              <span className="flex items-center gap-1 text-xs font-medium text-accent-600">
                <Check className="h-3.5 w-3.5" weight="bold" />
                Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      {subscription && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                <CreditCard className="h-4.5 w-4.5" weight="fill" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-semibold text-neutral-900">
                  Billing & plan
                </h3>
                <p className="text-xs text-neutral-500 capitalize">
                  {subscription.tier} · {subscription.active_client_count}
                  {subscription.client_limit ? ` / ${subscription.client_limit}` : ""} clients
                </p>
              </div>
            </div>
            <Link href={`/${params.slug}/billing`}>
              <Button variant="secondary">Manage billing</Button>
            </Link>
          </div>
        </Card>
      )}

      <AssistantSettingsCard />

      <AutomationSettingsCard />

      <LogoutCard />

      {user && <SecurityPrivacyCard user={user} onUserUpdate={setUser} />}
      </div>
    </div>
  );
}

// Moved here from the sidebar identity block — logout belongs with the
// rest of account management, not sitting alongside navigation.
function LogoutCard() {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-sm font-semibold text-neutral-900">Log out</h3>
          <p className="text-xs text-neutral-500">End your session on this device.</p>
        </div>
        <Button type="button" variant="secondary" onClick={performLogout}>
          <SignOut className="h-4 w-4" weight="bold" />
          Log out
        </Button>
      </div>
    </Card>
  );
}

export function ClientSettings() {
  const { user: cachedUser } = useCurrentUser();
  const [profile, setProfile] = useState<ClientSelfProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const userId = user?.id ?? null;
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cachedUser) setUser(cachedUser);
  }, [cachedUser]);

  useEffect(() => {
    api
      .getMyClientProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name);
        setTimezone(p.timezone);
      })
      .catch(() => {});
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setAvatarUploading(true);
    try {
      await api.uploadMyAvatar(file);
      setAvatarVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that photo. Try again.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateMyClientProfile({ name, timezone });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="animate-fade-up mx-auto max-w-4xl">
      <div className="mb-6">
        <Eyebrow className="mb-2">Your profile</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-600">Coaching with {profile.coach_name}.</p>
      </div>

      {/* Same Card component, spacing scale, and gap-6 rhythm as the coach's
          settings page (SettingsPage above) — split into purpose-scoped
          cards rather than one monolithic block, so both roles' settings
          read as the same product with only the field content differing. */}
      <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative shrink-0 disabled:cursor-wait"
            aria-label="Change profile photo"
          >
            {userId && (
              <Avatar
                key={avatarVersion}
                userId={userId}
                name={name || "?"}
                className="h-16 w-16 text-2xl"
              />
            )}
            <span
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white transition-opacity ${
                avatarUploading ? "bg-black/40! opacity-100" : "opacity-0 group-hover:bg-black/40 group-hover:opacity-100"
              }`}
            >
              {avatarUploading ? (
                <CircleNotch className="h-5 w-5 animate-spin-slow" weight="bold" />
              ) : (
                <Camera className="h-5 w-5" weight="bold" />
              )}
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{profile.email}</p>
            <p className="text-sm text-neutral-500">Client</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
            >
              {!TIMEZONES.includes(timezone) && timezone && (
                <option value={timezone}>{timezoneLabel(timezone)}</option>
              )}
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {timezoneLabel(tz)}
                </option>
              ))}
            </select>
          </div>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-xs font-medium text-accent-600">
                <Check className="h-3.5 w-3.5" weight="bold" />
                Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      {(profile.goals || profile.niche || profile.phone) && (
        <Card>
          <h3 className="font-heading mb-3 text-sm font-semibold text-neutral-900">
            About your coaching
          </h3>
          <div className="flex flex-col gap-3 text-sm text-neutral-600">
            {profile.goals && (
              <div>
                <Label>Your goal</Label>
                <p>{profile.goals}</p>
              </div>
            )}
            {profile.niche && <p>Focus area: {profile.niche.charAt(0).toUpperCase() + profile.niche.slice(1)}</p>}
            {profile.phone && <p>Phone: {profile.phone}</p>}
            <p>
              Status:{" "}
              <span className="font-medium text-neutral-900">
                {CLIENT_STATUS_LABEL[profile.status]}
              </span>
            </p>
          </div>
        </Card>
      )}

      <LogoutCard />

      {user && <SecurityPrivacyCard user={user} onUserUpdate={setUser} />}
      </div>
    </div>
  );
}

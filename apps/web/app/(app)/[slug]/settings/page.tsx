"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
} from "@phosphor-icons/react";
import { api, ApiError, ClientSelfProfile, CoachProfile, PlatformSubscriptionData } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { Button, Card, ErrorBanner, Eyebrow, Input, Label } from "@/components/ui";
import { useViewerRole } from "@/lib/useViewerRole";
import Avatar from "@/components/Avatar";

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
  if (role === null) return null;
  return role === "client" ? <ClientSettings /> : <CoachSettings />;
}

function CoachSettings() {
  const params = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [subscription, setSubscription] = useState<PlatformSubscriptionData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState<(typeof NICHES)[number]["value"] | "">("");
  const [otherNiche, setOtherNiche] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.me().then((u) => setUserId(u.id)).catch(() => {});
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
      })
      .catch(() => {});
    api.getPlatformSubscription().then(setSubscription).catch(() => {});
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await api.uploadMyAvatar(file);
    setAvatarVersion((v) => v + 1);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
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
        timezone,
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
    <div className="max-w-2xl">
      <div className="mb-6">
        <Eyebrow className="mb-2">Your profile</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          Coach profile
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          This is how you and your practice show up across CoachevaOS.
        </p>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="group relative shrink-0"
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
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
              <Camera className="h-5 w-5" weight="bold" />
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
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
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

      {subscription && (
        <Card className="mt-6">
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
    </div>
  );
}

function ClientSettings() {
  const [profile, setProfile] = useState<ClientSelfProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.me().then((u) => setUserId(u.id)).catch(() => {});
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
    await api.uploadMyAvatar(file);
    setAvatarVersion((v) => v + 1);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
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
    <div className="max-w-lg">
      <div className="mb-6">
        <Eyebrow className="mb-2">Your profile</Eyebrow>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-600">Coaching with {profile.coach_name}.</p>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="group relative shrink-0"
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
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
              <Camera className="h-5 w-5" weight="bold" />
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
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>

          {profile.goals && (
            <div>
              <Label>Your goal</Label>
              <p className="text-sm text-neutral-600">{profile.goals}</p>
            </div>
          )}

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
    </div>
  );
}

"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CopySimpleIcon as CopySimple,
  CheckIcon as Check,
  ChatCircleIcon as ChatCircle,
  EnvelopeSimpleIcon as EnvelopeSimple,
  CameraIcon as Camera,
  FileTextIcon as FileText,
  CheckSquareIcon as CheckSquare,
  CircleNotchIcon as CircleNotch,
  PhoneIcon as Phone,
} from "@phosphor-icons/react";
import {
  api,
  ApiError,
  ClientDetail,
  CoachProfile,
  DocumentData,
  IntakeResponseData,
  TaskData,
  User,
} from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { buildInviteMessage } from "@/lib/inviteMessage";
import { getNicheConfig } from "@/lib/niche";
import { NICHES } from "@/lib/niches";
import { Button, Card, Input } from "@/components/ui";
import Dialog from "@/components/Dialog";
import TaskList from "@/components/TaskList";
import DocumentList from "@/components/DocumentList";
import ClientBillingCard from "@/components/ClientBillingCard";
import ProgressCard from "@/components/ProgressCard";
import GoalsAndProgress from "@/components/GoalsAndProgress";
import ChurnTrend from "@/components/ChurnTrend";
import OnboardingAgentDialog from "@/components/OnboardingAgentDialog";
import ProgramGenerator from "@/components/ProgramGenerator";
import CustomFieldsCard from "@/components/CustomFieldsCard";
import MetricsCard from "@/components/MetricsCard";
import SessionsCard from "@/components/SessionsCard";
import ScheduleBuilder from "@/components/ScheduleBuilder";
import SessionAttendanceLog from "@/components/SessionAttendanceLog";
import ClientSnapshotCard from "@/components/ClientSnapshotCard";
import TimelineCard from "@/components/TimelineCard";
import CopilotShell from "@/components/CopilotShell";
import Avatar from "@/components/Avatar";
import dynamic from "next/dynamic";
import { useRoleGuard } from "@/lib/useRoleGuard";

const AISessionAssistant = dynamic(() => import("@/components/AISessionAssistant"), { ssr: false });

function clientLocalTime(timezone: string): string {
  try {
    const time = new Intl.DateTimeFormat([], {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(new Date());
    return `${time} local time`;
  } catch {
    return "";
  }
}

const STATUS_LABEL: Record<ClientDetail["status"], string> = {
  active: "Active",
  at_risk: "At risk",
  paused: "Paused",
  churned: "Churned",
  deleted: "Deleted",
};
// "deleted" is a real, coach-facing status flip (see delete_client on the
// backend) but never a manual dropdown option — it only happens through the
// dedicated delete action below, with its own confirmation.
const SELECTABLE_STATUSES = (Object.keys(STATUS_LABEL) as ClientDetail["status"][]).filter(
  (s) => s !== "deleted"
);

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id, slug } = use(params);
  const router = useRouter();
  const roleOk = useRoleGuard("coach");
  const { user: coach } = useCurrentUser();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scheduleBuilderOpen, setScheduleBuilderOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [coachingStart, setCoachingStart] = useState("");
  const [coachingEnd, setCoachingEnd] = useState("");
  const [coachingDatesSaving, setCoachingDatesSaving] = useState(false);
  const [coachingDatesSaved, setCoachingDatesSaved] = useState(false);
  const [coachingDatesError, setCoachingDatesError] = useState<string | null>(null);
  const [intake, setIntake] = useState<IntakeResponseData | null | "loading">("loading");
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [portalCopied, setPortalCopied] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [messageCopied, setMessageCopied] = useState(false);
  const [messageText, setMessageText] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [goalsRefreshKey, setGoalsRefreshKey] = useState(0);
  const [sessionsRefreshKey, setSessionsRefreshKey] = useState(0);
  const [goalsText, setGoalsText] = useState("");
  const [programText, setProgramText] = useState("");
  const [nicheText, setNicheText] = useState("");
  const [emailText, setEmailText] = useState("");
  const [phoneText, setPhoneText] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function changeStatus(next: ClientDetail["status"]) {
    if (!client || next === client.status) return;
    const previous = client.status;
    setClient({ ...client, status: next });
    setStatusSaving(true);
    setStatusError(null);
    try {
      await api.updateClient(id, { status: next });
    } catch (err) {
      setClient((c) => (c ? { ...c, status: previous } : c));
      setStatusError(err instanceof ApiError ? err.message : "Couldn't update status. Try again.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function saveCoachingDates() {
    setCoachingDatesSaving(true);
    setCoachingDatesError(null);
    try {
      const updated = await api.updateCoachingDates(id, {
        coaching_start_date: coachingStart || null,
        coaching_end_date: coachingEnd || null,
      });
      setClient(updated);
      setCoachingDatesSaved(true);
      setTimeout(() => setCoachingDatesSaved(false), 2000);
    } catch (err) {
      setCoachingDatesError(
        err instanceof ApiError ? err.message : "Couldn't save. Try again."
      );
    } finally {
      setCoachingDatesSaving(false);
    }
  }

  async function handleDelete() {
    if (!client || confirmName !== client.name) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteClient(id);
      router.push(`/${slug}/clients`);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Couldn't delete this client. Try again.");
      setDeleting(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      await api.uploadClientAvatar(id, file);
      setAvatarVersion((v) => v + 1);
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Couldn't upload that photo. Try again.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  function refreshTasks() {
    api.listClientTasks(id).then(setTasks).catch(() => {});
  }

  function refreshDocuments() {
    api.listClientDocuments(id).then(setDocuments).catch(() => {});
  }

  function refreshClient() {
    return api.getClient(id).then((c) => {
      setClient(c);
      setNotes(c.notes ?? "");
      setGoalsText(c.goals ?? "");
      setProgramText(c.program ?? "");
      setNicheText(c.niche ?? "");
      setEmailText(c.email ?? "");
      setPhoneText(c.phone ?? "");
      setCoachingStart(c.coaching_start_date ?? "");
      setCoachingEnd(c.coaching_end_date ?? "");
      return c;
    });
  }

  useEffect(() => {
    refreshClient().catch(() => {});
    api
      .getClientIntake(id)
      .then(setIntake)
      .catch((err) => setIntake(err instanceof ApiError && err.status === 404 ? null : null));
    api.myProfile().then(setProfile).catch(() => {});
    refreshTasks();
    refreshDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveNotes() {
    setNotesError(null);
    try {
      await api.updateClientNotes(id, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      setNotesError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    }
  }

  async function saveProfile() {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const updated = await api.updateClient(id, {
        goals: goalsText,
        program: programText,
        niche: nicheText,
        email: emailText,
        phone: phoneText,
      });
      setClient(updated);
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  // Shared by all three "copy a link" actions below — the client's
  // invite_pending flag can go stale if they accept the invite in another
  // tab/session while this page stays open, so a 409 here means the UI is
  // out of date, not that anything actually went wrong. Re-fetching the
  // client corrects invite_pending so the now-invalid button disappears
  // instead of staying clickable and failing the same way again.
  async function handleLinkError(err: unknown) {
    setLinkError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    await refreshClient().catch(() => {});
  }

  async function copyInvite() {
    setLinkError(null);
    try {
      const invite = await api.getClientInvite(id);
      const url = `${window.location.origin}${invite.invite_path}`;
      const ok = await copyText(url);
      if (ok) {
        setCopied(true);
        setInviteUrl(null);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Clipboard API blocked (e.g. unfocused window) — fall back to a
        // selectable field so the link can still be copied manually.
        setInviteUrl(url);
      }
    } catch (err) {
      await handleLinkError(err);
    }
  }

  async function copyInviteMessage() {
    if (!client) return;
    setLinkError(null);
    try {
      const invite = await api.getClientInvite(id);
      const url = `${window.location.origin}${invite.invite_path}`;
      const message = buildInviteMessage({
        clientName: client.name,
        clientEmail: client.email,
        coachName: coach?.name ?? "",
        businessName: profile?.business_name,
        inviteUrl: url,
      });
      const ok = await copyText(message);
      if (ok) {
        setMessageCopied(true);
        setMessageText(null);
        setTimeout(() => setMessageCopied(false), 2000);
      } else {
        // Clipboard API blocked (e.g. unfocused window) — fall back to a
        // selectable field, same pattern as copyInvite/copyPortalLink.
        setMessageText(message);
      }
    } catch (err) {
      await handleLinkError(err);
    }
  }

  async function copyPortalLink() {
    setLinkError(null);
    try {
      const link = await api.getClientPortalLink(id);
      const url = `${window.location.origin}${link.portal_path}`;
      const ok = await copyText(url);
      if (ok) {
        setPortalCopied(true);
        setPortalUrl(null);
        setTimeout(() => setPortalCopied(false), 2000);
      } else {
        setPortalUrl(url);
      }
    } catch (err) {
      await handleLinkError(err);
    }
  }

  if (!roleOk || !client) return null;

  return (
    <div className="animate-fade-up flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-70">
        <Card className="flex flex-col items-center overflow-hidden text-center">
          <div
            className="-mx-7 -mt-7 mb-4 h-16 w-[calc(100%+3.5rem)] shrink-0"
            style={{
              background: profile?.brand_color
                ? `linear-gradient(135deg, ${profile.brand_color}, var(--color-neutral-900))`
                : "linear-gradient(135deg, var(--color-accent-600), var(--color-neutral-900))",
            }}
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative mb-4 shrink-0 disabled:cursor-wait"
            aria-label="Change client photo"
          >
            <Avatar
              key={avatarVersion}
              userId={client.user_id}
              name={client.name}
              className="h-35 w-35 text-3xl"
            />
            <span
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white transition-opacity ${
                avatarUploading ? "bg-black/40! opacity-100" : "opacity-0 group-hover:bg-black/40 group-hover:opacity-100"
              }`}
            >
              {avatarUploading ? (
                <CircleNotch className="h-6 w-6 animate-spin-slow" weight="bold" />
              ) : (
                <Camera className="h-6 w-6" weight="bold" />
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
          {avatarError && <p className="mb-2 text-xs text-accent-600">{avatarError}</p>}
          <h1 className="font-heading text-xl font-semibold text-neutral-900">{client.name}</h1>
          <p className="flex items-center gap-1.5 text-sm text-neutral-600">
            <EnvelopeSimple className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            {client.email}
          </p>
          {client.phone && (
            <p className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              {client.phone}
            </p>
          )}
          <p className="mb-3 text-xs text-neutral-500">
            {intake === null ? "Timezone not set yet" : clientLocalTime(client.timezone)}
          </p>
          <select
            value={client.status}
            onChange={(e) => changeStatus(e.target.value as ClientDetail["status"])}
            disabled={statusSaving}
            className="mb-4 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700 outline-none disabled:opacity-60"
          >
            {SELECTABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          {statusError && <p className="mb-4 text-xs text-accent-600">{statusError}</p>}
          <p className="mb-4 text-xs text-neutral-500">
            Joined {new Date(client.joined_at).toLocaleDateString()}
          </p>
          {client.thread_id && (
            <Link href={`/${slug}/chat/${client.thread_id}`} className="w-full">
              <Button variant="secondary" className="w-full">
                <ChatCircle className="h-4 w-4" weight="bold" />
                Message
              </Button>
            </Link>
          )}
          {client.invite_pending && (
            <div className="mt-4 w-full">
              <Button variant="secondary" className="w-full" onClick={copyInvite}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4" weight="bold" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopySimple className="h-4 w-4" weight="bold" />
                    Copy invite link
                  </>
                )}
              </Button>
              {inviteUrl && (
                <Input
                  readOnly
                  value={inviteUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-2 text-xs"
                />
              )}
              <Button variant="ghost" className="mt-2 w-full" onClick={copyInviteMessage}>
                {messageCopied ? (
                  <>
                    <Check className="h-4 w-4" weight="bold" />
                    Copied
                  </>
                ) : (
                  <>
                    <EnvelopeSimple className="h-4 w-4" weight="bold" />
                    Copy message to send
                  </>
                )}
              </Button>
              {messageText && (
                <textarea
                  readOnly
                  value={messageText}
                  onFocus={(e) => e.currentTarget.select()}
                  rows={6}
                  className="mt-2 w-full resize-none rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-xs text-neutral-900 outline-none focus:border-accent-500"
                />
              )}
            </div>
          )}
          {!client.invite_pending && (
            <div className="mt-4 w-full">
              <Button variant="secondary" className="w-full" onClick={copyPortalLink}>
                {portalCopied ? (
                  <>
                    <Check className="h-4 w-4" weight="bold" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopySimple className="h-4 w-4" weight="bold" />
                    Copy portal link
                  </>
                )}
              </Button>
              {portalUrl && (
                <Input
                  readOnly
                  value={portalUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-2 text-xs"
                />
              )}
            </div>
          )}
          {linkError && <p className="mt-2 text-xs text-accent-600">{linkError}</p>}
          <div className="mt-2.5 w-full">
            <OnboardingAgentDialog
              clientId={id}
              threadId={client.thread_id}
              onDone={() => setGoalsRefreshKey((k) => k + 1)}
            />
          </div>
          <div className="mt-2.5 w-full">
            <Button variant="secondary" className="w-full" onClick={() => setScheduleBuilderOpen(true)}>
              Schedule sessions
            </Button>
          </div>
          <div className="mt-3 w-full border-t border-neutral-100 pt-3">
            <p className="mb-1.5 text-xs font-medium text-neutral-500">Coaching period</p>
            <div className="flex flex-col gap-1.5">
              <Input
                type="date"
                value={coachingStart}
                onChange={(e) => setCoachingStart(e.target.value)}
                className="w-full text-xs"
              />
              <span className="text-xs text-neutral-400">to</span>
              <Input
                type="date"
                value={coachingEnd}
                onChange={(e) => setCoachingEnd(e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={coachingDatesSaving}
                onClick={saveCoachingDates}
              >
                {coachingDatesSaved ? "Saved" : "Save"}
              </Button>
            </div>
            {coachingDatesError && (
              <p className="mt-1.5 text-xs text-accent-600">{coachingDatesError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-3 text-xs font-medium text-neutral-400 hover:text-red-600"
          >
            Delete client
          </button>
        </Card>
      </aside>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this client">
        <p className="mb-4 text-sm text-neutral-600">
          This archives {client.name}. They&apos;ll disappear from your client list, but their
          messages, documents, and invoices are kept. This can&apos;t be undone from here. Type{" "}
          <span className="font-semibold">{client.name}</span> to confirm.
        </p>
        <Input
          className="mb-4"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder={client.name}
        />
        {deleteError && <p className="mb-3 text-xs text-accent-600">{deleteError}</p>}
        <Button
          variant="secondary"
          disabled={confirmName !== client.name}
          loading={deleting}
          onClick={handleDelete}
        >
          Delete {client.name}
        </Button>
      </Dialog>

      <Dialog
        open={scheduleBuilderOpen}
        onClose={() => setScheduleBuilderOpen(false)}
        title="Schedule sessions"
        widthClassName="max-w-lg"
      >
        <ScheduleBuilder
          clientId={id}
          onClose={() => setScheduleBuilderOpen(false)}
          onCreated={() => setSessionsRefreshKey((k) => k + 1)}
        />
      </Dialog>

      <div className="flex flex-1 flex-col gap-6">
        <Card>
          <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
            Intake responses
          </h3>
          {intake === "loading" ? null : intake === null ? (
            <p className="text-sm text-neutral-500">
              Not submitted yet. Sent with the client&apos;s invite link.
            </p>
          ) : (
            <div className="flex flex-col gap-2 text-sm text-neutral-900">
              <p>
                <span className="text-neutral-500">Goal: </span>
                {intake.goals ?? "—"}
              </p>
              <p>
                <span className="text-neutral-500">Experience: </span>
                {intake.experience ?? "—"}
              </p>
              <p>
                <span className="text-neutral-500">Availability: </span>
                {intake.availability ?? "—"}
              </p>
              <p>
                <span className="text-neutral-500">Notes: </span>
                {intake.notes ?? "—"}
              </p>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-neutral-900">
              {getNicheConfig(profile?.niche).goalLabel}
            </h3>
            {!editingProfile && (
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="text-xs font-medium text-accent-600 hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {editingProfile ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">
                  {getNicheConfig(profile?.niche).goalLabel}
                </label>
                <textarea
                  value={goalsText}
                  onChange={(e) => setGoalsText(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">Program</label>
                <Input value={programText} onChange={(e) => setProgramText(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">
                  Niche
                </label>
                <select
                  value={nicheText}
                  onChange={(e) => setNicheText(e.target.value)}
                  className="w-full rounded-[10px] border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent-500 focus:bg-white"
                >
                  <option value="">Use your default niche</option>
                  {NICHES.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-neutral-500">
                  Only needed if this client&apos;s coaching type differs from your own default,
                  e.g. a nutrition client on a mostly-fitness practice.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">Email</label>
                <Input
                  type="email"
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  This is also their login — they&apos;ll need to sign in with the new address next
                  time.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">Phone</label>
                <Input value={phoneText} onChange={(e) => setPhoneText(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveProfile} loading={profileSaving}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileError(null);
                    setGoalsText(client.goals ?? "");
                    setProgramText(client.program ?? "");
                    setEmailText(client.email ?? "");
                    setPhoneText(client.phone ?? "");
                  }}
                >
                  Cancel
                </Button>
              </div>
              {profileError && <p className="text-xs text-accent-600">{profileError}</p>}
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-600">{client.goals ?? "No goal set yet."}</p>
              {client.program && <p className="mt-2 text-xs text-neutral-500">Program: {client.program}</p>}
            </>
          )}
        </Card>

        <CustomFieldsCard
          fetchFields={() => api.getClientCustomFields(id)}
          onSetValue={(defId, value) => api.setClientCustomFieldValue(id, defId, value)}
          editable
        />
        <MetricsCard
          listDefinitions={() => api.listMetricDefinitions()}
          listEntries={(defId) => api.listClientMetricEntries(id, defId)}
          createEntry={(defId, body) => api.createClientMetricEntry(id, defId, body)}
        />
        <ProgressCard fetchInsight={(force) => api.getClientProgressInsight(id, force)} />
        <GoalsAndProgress
          key={goalsRefreshKey}
          listGoals={() => api.listClientGoals(id)}
          createGoal={(body) => api.createClientGoal(id, body)}
          updateGoal={(goalId, body) => api.updateClientGoal(id, goalId, body)}
          deleteGoal={(goalId) => api.deleteClientGoal(id, goalId)}
          listProgress={() => api.listClientProgress(id)}
          createProgress={(note, entryDate, file) => api.createClientProgress(id, note, entryDate, file)}
        />
        <SessionsCard
          listSessions={() => api.listClientSessions(id)}
          createSession={(body) => api.createClientSession(id, body)}
          deleteSession={(noteId) => api.deleteClientSession(id, noteId)}
        />
        <SessionAttendanceLog clientId={id} refreshKey={sessionsRefreshKey} />
        <ClientBillingCard clientId={id} threadId={client.thread_id} />

        <CopilotShell title="AI insights" subtitle="Churn risk, program, and full history for this client">
          <ChurnTrend clientId={id} />
          <ClientSnapshotCard clientId={id} />
          <ProgramGenerator clientId={id} />
          <TimelineCard fetchTimeline={() => api.getClientTimeline(id)} />
        </CopilotShell>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">Coach notes</h3>
            {notesSaved && (
              <span className="flex items-center gap-1 text-xs font-medium text-accent-600">
                <Check className="h-3.5 w-3.5" weight="bold" />
                Saved
              </span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={4}
            placeholder="Private notes only you can see…"
            className="w-full rounded-[12px] border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100"
          />
          {notesError && <p className="mt-1.5 text-xs text-accent-600">{notesError}</p>}
        </Card>

        <AISessionAssistant clientId={id} />

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <FileText className="h-3.5 w-3.5" weight="fill" />
            </span>
            <h3 className="font-heading text-lg font-semibold text-neutral-900">Documents</h3>
          </div>
          <DocumentList
            documents={documents}
            onUpload={async (file) => {
              await api.uploadClientDocument(id, file);
              refreshDocuments();
            }}
          />
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <CheckSquare className="h-3.5 w-3.5" weight="fill" />
            </span>
            <h3 className="font-heading text-lg font-semibold text-neutral-900">Tasks</h3>
          </div>
          <TaskList
            tasks={tasks}
            viewerUserId={coach?.id ?? null}
            onAdd={async (title, dueDate) => {
              await api.addClientTask(id, { title, due_date: dueDate });
              refreshTasks();
            }}
            onToggle={async (taskId) => {
              await api.toggleTaskComplete(taskId);
              refreshTasks();
            }}
            onEdit={async (taskId, title, dueDate) => {
              await api.updateTask(taskId, { title, due_date: dueDate });
              refreshTasks();
            }}
          />
        </Card>
      </div>
    </div>
  );
}

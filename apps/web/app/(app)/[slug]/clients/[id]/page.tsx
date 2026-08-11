"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  CopySimpleIcon as CopySimple,
  CheckIcon as Check,
  ChatCircleIcon as ChatCircle,
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
import { getNicheConfig } from "@/lib/niche";
import { Button, Card, Input } from "@/components/ui";
import TaskList from "@/components/TaskList";
import DocumentList from "@/components/DocumentList";
import ClientBillingCard from "@/components/ClientBillingCard";
import ProgressCard from "@/components/ProgressCard";
import GoalsAndProgress from "@/components/GoalsAndProgress";
import Avatar from "@/components/Avatar";
import dynamic from "next/dynamic";

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
};

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id, slug } = use(params);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [intake, setIntake] = useState<IntakeResponseData | null | "loading">("loading");
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [coach, setCoach] = useState<User | null>(null);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [goalsText, setGoalsText] = useState("");
  const [programText, setProgramText] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  function refreshTasks() {
    api.listClientTasks(id).then(setTasks).catch(() => {});
  }

  function refreshDocuments() {
    api.listClientDocuments(id).then(setDocuments).catch(() => {});
  }

  useEffect(() => {
    api
      .getClient(id)
      .then((c) => {
        setClient(c);
        setNotes(c.notes ?? "");
        setGoalsText(c.goals ?? "");
        setProgramText(c.program ?? "");
      })
      .catch(() => {});
    api
      .getClientIntake(id)
      .then(setIntake)
      .catch((err) => setIntake(err instanceof ApiError && err.status === 404 ? null : null));
    api.me().then(setCoach).catch(() => {});
    api.myProfile().then(setProfile).catch(() => {});
    refreshTasks();
    refreshDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveNotes() {
    await api.updateClientNotes(id, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  async function saveProfile() {
    setProfileSaving(true);
    try {
      const updated = await api.updateClient(id, { goals: goalsText, program: programText });
      setClient(updated);
      setEditingProfile(false);
    } finally {
      setProfileSaving(false);
    }
  }

  async function copyInvite() {
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
  }

  if (!client) return null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-70">
        <Card className="flex flex-col items-center text-center">
          <Avatar
            userId={client.user_id}
            name={client.name}
            className="mb-4 h-35 w-35 text-3xl"
          />
          <h1 className="font-heading text-xl font-semibold text-neutral-900">{client.name}</h1>
          <p className="text-sm text-neutral-600">{client.email}</p>
          <p className="mb-3 text-xs text-neutral-500">{clientLocalTime(client.timezone)}</p>
          <span className="mb-4 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
            {STATUS_LABEL[client.status]}
          </span>
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
            </div>
          )}
        </Card>
      </aside>

      <div className="flex flex-1 flex-col gap-6">
        <Card>
          <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
            Intake responses
          </h3>
          {intake === "loading" ? null : intake === null ? (
            <p className="text-sm text-neutral-500">
              Not submitted yet — sent with the client&apos;s invite link.
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
              <div className="flex items-center gap-2">
                <Button onClick={saveProfile} loading={profileSaving}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setEditingProfile(false);
                    setGoalsText(client.goals ?? "");
                    setProgramText(client.program ?? "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-600">{client.goals ?? "No goal set yet."}</p>
              {client.program && <p className="mt-2 text-xs text-neutral-500">Program: {client.program}</p>}
            </>
          )}
        </Card>

        <ProgressCard fetchInsight={() => api.getClientProgressInsight(id)} />
        <GoalsAndProgress
          listGoals={() => api.listClientGoals(id)}
          createGoal={(body) => api.createClientGoal(id, body)}
          updateGoal={(goalId, body) => api.updateClientGoal(id, goalId, body)}
          deleteGoal={(goalId) => api.deleteClientGoal(id, goalId)}
          listProgress={() => api.listClientProgress(id)}
          createProgress={(note, entryDate, file) => api.createClientProgress(id, note, entryDate, file)}
        />
        <ClientBillingCard clientId={id} />

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
        </Card>

        <AISessionAssistant clientId={id} />

        <Card>
          <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">Documents</h3>
          <DocumentList
            documents={documents}
            onUpload={async (file) => {
              await api.uploadClientDocument(id, file);
              refreshDocuments();
            }}
          />
        </Card>

        <Card>
          <h3 className="font-heading mb-3 text-lg font-semibold text-neutral-900">Tasks</h3>
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

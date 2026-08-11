"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  UserPlusIcon as UserPlus,
  CopySimpleIcon as CopySimple,
  CheckIcon as Check,
  UploadSimpleIcon as UploadSimple,
} from "@phosphor-icons/react";
import { api, ApiError, ClientListItem } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { Button, Card, Eyebrow, Input, Label } from "@/components/ui";
import Dialog from "@/components/Dialog";
import Avatar from "@/components/Avatar";

const STATUS_LABEL: Record<ClientListItem["status"], string> = {
  active: "Active",
  at_risk: "At risk",
  paused: "Paused",
  churned: "Churned",
};

function StatusTag({ status }: { status: ClientListItem["status"] }) {
  const cls =
    status === "at_risk"
      ? "bg-accent-200 text-accent-800 font-semibold"
      : status === "active"
        ? "bg-accent-100 text-accent-700"
        : "bg-neutral-200 text-neutral-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs ${cls}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function ClientsPage() {
  const params = useParams<{ slug: string }>();
  const [clients, setClients] = useState<ClientListItem[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [goals, setGoals] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteBanner, setInviteBanner] = useState<{ name: string; path: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  function refresh() {
    api.listClients().then(setClients).catch(() => setClients([]));
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const client = await api.createClient({
        name,
        email,
        program: program || undefined,
        goals: goals || undefined,
      });
      const invite = await api.getClientInvite(client.id);
      setInviteBanner({ name: client.name, path: invite.invite_path });
      setInviteUrl(null);
      setDialogOpen(false);
      setName("");
      setEmail("");
      setProgram("");
      setGoals("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function copyInvite() {
    if (!inviteBanner) return;
    const url = `${window.location.origin}${inviteBanner.path}`;
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setInviteUrl(url);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Eyebrow className="mb-2">Roster</Eyebrow>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-neutral-900">
            Clients
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href={`/${params.slug}/clients/import`}>
            <Button variant="secondary">
              <UploadSimple className="h-4 w-4" weight="bold" />
              Import clients
            </Button>
          </Link>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4" weight="bold" />
            Add client
          </Button>
        </div>
      </div>

      {inviteBanner && (
        <Card className="mb-6 !border-accent-200 !bg-accent-100">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-neutral-700">
              <strong>{inviteBanner.name}</strong> added — share their invite link to get them
              started.
            </p>
            <Button variant="secondary" onClick={copyInvite}>
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
          </div>
          {inviteUrl && (
            <Input
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 text-xs"
            />
          )}
        </Card>
      )}

      {clients === null ? null : clients.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No clients yet — add your first one to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/${params.slug}/clients/${c.id}`}>
              <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(28,29,31,0.12)]">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar userId={c.user_id} name={c.name} className="h-11 w-11 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-neutral-900">{c.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {c.program ?? "No program set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <StatusTag status={c.status} />
                  {c.invite_pending && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                      Invite pending
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add client">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="c_name">Name</Label>
            <Input id="c_name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="c_email">Email</Label>
            <Input
              id="c_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="c_program">Program</Label>
            <Input id="c_program" value={program} onChange={(e) => setProgram(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="c_goals">Goal</Label>
            <Input id="c_goals" value={goals} onChange={(e) => setGoals(e.target.value)} />
          </div>
          {error && <p className="text-sm text-accent-700">{error}</p>}
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add client"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

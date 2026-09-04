"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useRoleGuard } from "@/lib/useRoleGuard";

const STATUS_LABEL: Record<ClientListItem["status"], string> = {
  active: "Active",
  at_risk: "At risk",
  paused: "Paused",
  churned: "Churned",
  deleted: "Deleted",
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
  const roleOk = useRoleGuard("coach");
  const params = useParams<{ slug: string }>();
  const [clients, setClients] = useState<ClientListItem[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState("");
  const [goals, setGoals] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteBanner, setInviteBanner] = useState<{ name: string; path: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ClientListItem["status"]>("all");
  const [sortBy, setSortBy] = useState<"joined_desc" | "joined_asc" | "name" | "program">(
    "joined_desc"
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  function refresh() {
    api.listClients().then(setClients).catch(() => setClients([]));
  }

  useEffect(refresh, []);
  useEffect(() => {
    api.getPendingImportCount().then((r) => setPendingCount(r.count)).catch(() => {});
  }, []);

  async function retryPendingImport() {
    setRetrying(true);
    setRetryError(null);
    try {
      const result = await api.retryPendingClientImport();
      refresh();
      const remaining = await api.getPendingImportCount();
      setPendingCount(remaining.count);
      if (result.created === 0 && remaining.count > 0) {
        setRetryError("Still at your plan's client limit. Upgrade to add the rest.");
      }
    } catch (err) {
      setRetryError(err instanceof ApiError ? err.message : "Couldn't retry. Try again.");
    } finally {
      setRetrying(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const client = await api.createClient({
        name,
        email,
        phone: phone || undefined,
        program: program || undefined,
        goals: goals || undefined,
      });
      const invite = await api.getClientInvite(client.id);
      setInviteBanner({ name: client.name, path: invite.invite_path });
      setInviteUrl(null);
      setDialogOpen(false);
      setName("");
      setEmail("");
      setPhone("");
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

  const visibleClients = useMemo(() => {
    if (!clients) return [];
    const filtered =
      statusFilter === "all" ? clients : clients.filter((c) => c.status === statusFilter);
    const sorted = [...filtered];
    switch (sortBy) {
      case "joined_desc":
        sorted.sort((a, b) => b.joined_at.localeCompare(a.joined_at));
        break;
      case "joined_asc":
        sorted.sort((a, b) => a.joined_at.localeCompare(b.joined_at));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "program":
        sorted.sort((a, b) => (a.program ?? "").localeCompare(b.program ?? ""));
        break;
    }
    return sorted;
  }, [clients, statusFilter, sortBy]);

  if (!roleOk) return null;

  return (
    <div className="animate-fade-up">
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

      {pendingCount > 0 && (
        <Card className="mb-6 !border-accent-200 !bg-accent-100">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-neutral-700">
              <strong>
                {pendingCount} client{pendingCount === 1 ? "" : "s"} waiting
              </strong>{" "}
              from an import that hit your plan&apos;s client limit. Upgrade your plan to add them,
              or retry now if you&apos;ve freed up space.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/${params.slug}/billing`}>
                <Button variant="secondary" className="!px-3 !py-1.5 text-xs">
                  Upgrade plan
                </Button>
              </Link>
              <Button
                variant="secondary"
                className="!px-3 !py-1.5 text-xs"
                loading={retrying}
                onClick={retryPendingImport}
              >
                Retry now
              </Button>
            </div>
          </div>
          {retryError && <p className="mt-2 text-xs text-red-700">{retryError}</p>}
        </Card>
      )}

      {inviteBanner && (
        <Card className="mb-6 !border-accent-200 !bg-accent-100">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-neutral-700">
              <strong>{inviteBanner.name}</strong> added. Share their invite link to get them
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

      {clients !== null && clients.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "active", "at_risk", "paused", "churned"] as const).map((s) => {
              const count = s === "all" ? clients.length : clients.filter((c) => c.status === s).length;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_LABEL[s]} ({count})
                </button>
              );
            })}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 outline-none"
          >
            <option value="joined_desc">Newest first</option>
            <option value="joined_asc">Oldest first</option>
            <option value="name">Name (A-Z)</option>
            <option value="program">Program (A-Z)</option>
          </select>
        </div>
      )}

      {clients === null ? null : clients.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No clients yet. Add your first one to get started.
          </p>
        </Card>
      ) : visibleClients.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">No clients in this status.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleClients.map((c) => (
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
            <Label htmlFor="c_phone">Phone (optional)</Label>
            <Input id="c_phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
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

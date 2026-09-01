"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheckIcon as ShieldCheck,
  CopySimpleIcon as CopySimple,
} from "@phosphor-icons/react";
import { api, ApiError, User } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { Button, Card, ErrorBanner, Input, Label } from "@/components/ui";
import Dialog from "@/components/Dialog";

type MfaStep = "closed" | "qr" | "backup_codes" | "disable";

export default function SecurityPrivacyCard({
  user,
  onUserUpdate,
}: {
  user: User;
  onUserUpdate: (user: User) => void;
}) {
  const router = useRouter();
  const [mfaStep, setMfaStep] = useState<MfaStep>("closed");
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function closeMfaDialog() {
    setMfaStep("closed");
    setError(null);
    setCode("");
    setPassword("");
  }

  async function startSetup() {
    setError(null);
    setLoading(true);
    try {
      const setup = await api.setupMfa();
      setQrDataUri(setup.qr_data_uri);
      setSecret(setup.secret);
      setMfaStep("qr");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.enableMfa(code);
      setBackupCodes(result.backup_codes);
      setMfaStep("backup_codes");
      onUserUpdate({ ...user, mfa_enabled: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.disableMfa(password, code);
      onUserUpdate({ ...user, mfa_enabled: false });
      closeMfaDialog();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExportError(null);
    try {
      const data = await api.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "coachevaos-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Couldn't export your data. Try again.");
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.deleteMyAccount();
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Couldn't delete your account. Try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <ShieldCheck className="h-4.5 w-4.5" weight="fill" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-semibold text-neutral-900">
                Two-factor authentication
              </h3>
              <p className="text-xs text-neutral-500">
                {user.mfa_enabled
                  ? "Enabled: a code from your authenticator app is required to log in."
                  : "Add an extra layer of security to your account."}
              </p>
            </div>
          </div>
          {user.mfa_enabled ? (
            <Button variant="secondary" onClick={() => setMfaStep("disable")}>
              Disable
            </Button>
          ) : (
            <Button variant="secondary" loading={loading} onClick={startSetup}>
              Enable
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-heading mb-1 text-sm font-semibold text-neutral-900">Your data</h3>
        <p className="mb-3 text-xs text-neutral-500">Download a copy of everything on your account.</p>
        <Button variant="secondary" onClick={handleExport}>
          Export my data
        </Button>
        {exportError && <p className="mt-2.5 text-xs text-accent-600">{exportError}</p>}
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="text-xs text-neutral-400 underline decoration-neutral-300 underline-offset-2 hover:text-accent-600"
          >
            Delete my account
          </button>
        </div>
      </Card>

      <Dialog
        open={mfaStep === "qr"}
        onClose={closeMfaDialog}
        title="Scan this QR code"
      >
        <p className="mb-4 text-sm text-neutral-600">
          Scan with your authenticator app (Google Authenticator, Authy, 1Password), then enter
          the 6-digit code it shows.
        </p>
        {qrDataUri && (
          <Image
            src={qrDataUri}
            alt="MFA QR code"
            width={160}
            height={160}
            unoptimized
            className="mx-auto mb-4 h-40 w-40"
          />
        )}
        {secret && (
          <p className="mb-4 text-center font-mono text-xs text-neutral-500 select-all">{secret}</p>
        )}
        <form onSubmit={confirmEnable} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="mfa-setup-code">6-digit code</Label>
            <Input id="mfa-setup-code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <Button type="submit" loading={loading}>
            Confirm
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={mfaStep === "backup_codes"}
        onClose={closeMfaDialog}
        title="Save your backup codes"
      >
        <p className="mb-4 text-sm text-neutral-600">
          Store these somewhere safe. Each can be used once if you lose access to your
          authenticator app. They won&apos;t be shown again.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-[12px] bg-neutral-100 p-3 font-mono text-xs text-neutral-800">
          {backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            type="button"
            onClick={() => copyText(backupCodes.join("\n"))}
          >
            <CopySimple className="h-4 w-4" />
            Copy all
          </Button>
          <Button type="button" onClick={closeMfaDialog}>
            Done
          </Button>
        </div>
      </Dialog>

      <Dialog open={mfaStep === "disable"} onClose={closeMfaDialog} title="Disable two-factor authentication">
        <form onSubmit={confirmDisable} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="disable-password">Current password</Label>
            <Input
              id="disable-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="disable-code">Authenticator code</Label>
            <Input id="disable-code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <Button type="submit" variant="secondary" loading={loading}>
            Disable
          </Button>
        </form>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account">
        <p className="mb-4 text-sm text-neutral-600">
          This can&apos;t be undone. Your name and email will be scrubbed and you won&apos;t be
          able to log in again. Type <span className="font-semibold">{user.email}</span> to
          confirm.
        </p>
        <Input
          className="mb-4"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder={user.email}
        />
        {deleteError && <ErrorBanner>{deleteError}</ErrorBanner>}
        <Button
          variant="secondary"
          disabled={confirmEmail !== user.email}
          loading={deleting}
          onClick={handleDelete}
          className="mt-4"
        >
          Permanently delete my account
        </Button>
      </Dialog>
    </>
  );
}

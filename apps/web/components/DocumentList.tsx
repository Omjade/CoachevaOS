"use client";

import { useRef, useState } from "react";
import {
  ImageIcon as ImageSquare,
  FileTextIcon as FileText,
  VideoCameraIcon as VideoCamera,
  MicrophoneIcon as Microphone,
  PaperclipIcon as Paperclip,
  ShareNetworkIcon as ShareNetwork,
} from "@phosphor-icons/react";
import { API_URL, ApiError, DocumentData } from "@/lib/api";
import { Button } from "@/components/ui";
import Dialog from "@/components/Dialog";

const TYPE_ICON: Record<string, typeof FileText> = {
  image: ImageSquare,
  pdf: FileText,
  video: VideoCamera,
  voice: Microphone,
  file: Paperclip,
};

export default function DocumentList({
  documents,
  onUpload,
  shareableClients,
  onShare,
}: {
  documents: DocumentData[];
  onUpload: (file: File) => Promise<void>;
  // Both provided together only on coach-facing call sites — a client
  // viewing their own files has nothing to share, so this stays undefined
  // there and no share affordance renders.
  shareableClients?: { id: string; name: string }[];
  onShare?: (documentId: string, clientIds: string[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharingDocId, setSharingDocId] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [shareResult, setShareResult] = useState<string | null>(null);

  function openShare(docId: string) {
    setSharingDocId(docId);
    setSelectedClientIds(new Set());
    setShareResult(null);
  }

  function toggleClient(clientId: string) {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  async function sendShare() {
    if (!sharingDocId || !onShare || selectedClientIds.size === 0) return;
    setSharing(true);
    try {
      await onShare(sharingDocId, Array.from(selectedClientIds));
      setShareResult("Shared.");
    } catch (err) {
      setShareResult(err instanceof ApiError ? err.message : "Couldn't share. Try again.");
    } finally {
      setSharing(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that file. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          id="doc-upload"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {error && <p className="text-right text-xs text-accent-600">{error}</p>}

      {documents.length === 0 ? (
        <p className="text-sm text-neutral-600">No files yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-sm border border-divider px-3 py-2.5 hover:bg-neutral-100/60"
            >
              <a
                href={`${API_URL}${doc.download_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                {(() => {
                  const Icon = TYPE_ICON[doc.type] ?? Paperclip;
                  return <Icon className="h-4 w-4 shrink-0 text-neutral-500" />;
                })()}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{doc.name}</p>
                  <p className="text-xs text-neutral-600">
                    {doc.uploaded_by_name} · {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </a>
              {shareableClients && onShare && (
                <button
                  type="button"
                  onClick={() => openShare(doc.id)}
                  aria-label="Share with clients"
                  className="shrink-0 text-neutral-400 hover:text-accent-600"
                >
                  <ShareNetwork className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {shareableClients && onShare && (
        <Dialog
          open={sharingDocId !== null}
          onClose={() => setSharingDocId(null)}
          title="Share with clients"
        >
          {shareResult ? (
            <p className="text-sm text-neutral-700">{shareResult}</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
                {shareableClients.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.has(c.id)}
                      onChange={() => toggleClient(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              <Button
                type="button"
                onClick={sendShare}
                loading={sharing}
                disabled={selectedClientIds.size === 0}
              >
                Send
              </Button>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}

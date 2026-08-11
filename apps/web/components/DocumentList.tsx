"use client";

import { useRef, useState } from "react";
import {
  ImageIcon as ImageSquare,
  FileTextIcon as FileText,
  VideoCameraIcon as VideoCamera,
  MicrophoneIcon as Microphone,
  PaperclipIcon as Paperclip,
} from "@phosphor-icons/react";
import { API_URL, DocumentData } from "@/lib/api";
import { Button } from "@/components/ui";

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
}: {
  documents: DocumentData[];
  onUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
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

      {documents.length === 0 ? (
        <p className="text-sm text-neutral-600">No files yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={`${API_URL}${doc.download_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-sm border border-divider px-3 py-2.5 hover:bg-neutral-100/60"
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
          ))}
        </div>
      )}
    </div>
  );
}

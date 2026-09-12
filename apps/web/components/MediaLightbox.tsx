"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon as X, DownloadSimpleIcon as DownloadSimple } from "@phosphor-icons/react";

export interface LightboxMedia {
  url: string;
  type: "image" | "video";
  caption?: string | null;
}

/** WhatsApp-style full-size preview for a tapped chat image/video — a
    portal, same reasoning as Dialog.tsx: anything short of document.body
    risks getting trapped inside a Framer Motion ancestor's transform. */
export default function MediaLightbox({
  media,
  onClose,
}: {
  media: LightboxMedia | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!media) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [media]);

  if (!media || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-full max-w-full flex-col items-center gap-3">
        {media.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.caption ?? ""} className="max-h-[85vh] max-w-full rounded-lg object-contain" />
        ) : (
          <video src={media.url} controls autoPlay className="max-h-[85vh] max-w-full rounded-lg" />
        )}
        {media.caption && <p className="max-w-md text-center text-sm text-white/80">{media.caption}</p>}
      </div>
      <div className="absolute top-4 right-4 flex gap-2">
        <a
          href={media.url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Download"
        >
          <DownloadSimple className="h-4 w-4" weight="bold" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-4 w-4" weight="bold" />
        </button>
      </div>
    </div>,
    document.body
  );
}

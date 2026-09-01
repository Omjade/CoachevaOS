"use client";

import { PlayIcon as Play } from "@phosphor-icons/react";
import Dialog from "@/components/Dialog";

export default function DemoVideoDialog({
  open,
  onClose,
  videoUrl,
}: {
  open: boolean;
  onClose: () => void;
  videoUrl?: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="See CoachevaOS in action" widthClassName="max-w-2xl">
      {videoUrl ? (
        <div className="aspect-video overflow-hidden rounded-[14px]">
          <iframe
            src={videoUrl}
            className="h-full w-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-[14px] bg-neutral-900 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
            <Play className="h-5 w-5" weight="fill" />
          </span>
          <p className="text-sm font-medium text-white">Demo video coming soon</p>
          <p className="max-w-xs text-xs text-neutral-400">
            We&apos;re putting together a walkthrough of CoachevaOS. Check back shortly.
          </p>
        </div>
      )}
    </Dialog>
  );
}

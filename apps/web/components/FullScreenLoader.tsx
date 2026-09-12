"use client";

import { motion } from "framer-motion";

// Replaces a bare `return null` during an auth/session check — on this dev
// machine's slow first-compile (a separate, already-flagged filesystem/AV
// issue, not fixed by this component), the gap between "page requested" and
// "content painted" can run several seconds to minutes; a `null` render
// during that gap shows as a flat, jarring background (near-black in dark
// mode, per globals.css's --color-bg) with zero feedback. A pulsing version
// of the real logo mark reads as more intentional/branded than a bare
// spinner, at the same visual cost.
//
// `message` is used specifically for the moment right after login/signup
// (the login/signup pages pass it while their own post-auth profile-resolve
// calls run) — ordinary in-app navigation never sets it and gets the plain
// mark by itself.
//
// `fill` must be true whenever this renders *inside* an already-mounted
// CoachShell/PortalShell (i.e. the sidebar is already on screen — see
// messages/page.tsx, coach/page.tsx, client/[clientId]/layout.tsx). The
// default `min-h-screen` assumes this is the ONLY thing on the page (true
// pre-shell: login/signup, the [slug]/layout.tsx role-resolve gate) — used
// inside an already-rendered shell it forces a hard 100vh floor starting
// from wherever the content pane happens to sit below the header, pushing
// the centered spinner well below the page's actual visual middle instead
// of centering within the space that's really available.
export default function FullScreenLoader({
  message,
  fill = false,
}: {
  message?: string;
  fill?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-4 bg-neutral-100 ${fill ? "h-full" : "min-h-screen"}`}
    >
      <motion.span
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-neutral-900 shadow-[0_8px_24px_rgba(28,29,31,0.18)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/coachevaos-logo.png" alt="" className="h-full w-full object-cover" />
      </motion.span>
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading text-sm font-medium text-neutral-600"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

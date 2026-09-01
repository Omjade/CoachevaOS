"use client";

import { motion } from "framer-motion";
import { Spinner } from "@/components/ui";

// Replaces a bare `return null` during an auth/session check — on this dev
// machine's slow first-compile (a separate, already-flagged filesystem/AV
// issue, not fixed by this component), the gap between "page requested" and
// "content painted" can run several seconds to minutes; a `null` render
// during that gap shows as a flat, jarring background (near-black in dark
// mode, per globals.css's --color-bg) with zero feedback. This at least
// shows a spinner once JS has actually started running.
//
// `message` is used specifically for the moment right after login/signup
// (the login/signup pages pass it while their own post-auth profile-resolve
// calls run) — ordinary in-app navigation never sets it and gets the plain
// spinner as before.
export default function FullScreenLoader({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-neutral-100">
      <Spinner />
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

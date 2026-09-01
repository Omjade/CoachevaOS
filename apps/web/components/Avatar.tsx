"use client";

import { useState } from "react";
import { avatarUrl } from "@/lib/api";

// Every <Avatar> for a user with no uploaded photo was hitting the backend and
// eating a real 404 on every single render — across every list, every page,
// every remount, with no de-dup (visible as repeated avatar 404 spam in the
// server logs for the same handful of user ids). Once we learn a user has no
// avatar, skip the network request entirely for the rest of this session
// instead of re-attempting and re-404ing on every mount.
const knownMissing = new Set<string>();

export default function Avatar({
  userId,
  name,
  className = "h-9 w-9 text-sm",
}: {
  userId: string;
  name: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(() => knownMissing.has(userId));

  if (!broken) {
    return (
      <img
        src={avatarUrl(userId)}
        alt={name}
        onError={() => {
          knownMissing.add(userId);
          setBroken(true);
        }}
        className={`shrink-0 rounded-full bg-neutral-200 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-600 font-semibold text-white ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

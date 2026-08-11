"use client";

import { useState } from "react";
import { avatarUrl } from "@/lib/api";

export default function Avatar({
  userId,
  name,
  className = "h-9 w-9 text-sm",
}: {
  userId: string;
  name: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!broken) {
    return (
      <img
        src={avatarUrl(userId)}
        alt={name}
        onError={() => setBroken(true)}
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

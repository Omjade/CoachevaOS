import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    // The backend serves avatars/progress media/message attachments from these
    // hosts — next/image needs an explicit allowlist for any remote source.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  experimental: {
    // Turbopack's persistent dev filesystem cache defaults to on — its periodic
    // "compaction" writes were measured at 10+ minutes on this machine (real-time
    // antivirus scanning every file write to .next/dev is the near-certain cause,
    // per Next's own "slow filesystem detected" warning). Disabling it trades away
    // cache warmth across dev-server restarts for eliminating those multi-minute
    // stalls mid-session — a large net win until the real fix (a Defender exclusion
    // for this folder, which needs an admin-elevated terminal) is applied.
    turbopackFileSystemCacheForDev: false,
    // Barrel-style packages (one big icon/chart/animation export surface) force
    // Turbopack to parse the whole package on every file that imports from them.
    // This app imports individual icons from @phosphor-icons/react in dozens of
    // files — telling Next to auto-rewrite those into per-icon deep imports cuts
    // real per-route compile work, independent of the disk-speed issue above.
    optimizePackageImports: [
      "@phosphor-icons/react",
      "recharts",
      "framer-motion",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
  },
};

export default nextConfig;

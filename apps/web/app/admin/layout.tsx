import type { Metadata } from "next";
import AdminGate from "@/components/AdminGate";

// Belt-and-suspenders with robots.ts's /admin disallow entry: robots.txt only
// politely asks compliant crawlers not to fetch this, noindex here prevents
// indexing even if a URL is discovered another way (e.g. a leaked link,
// browser history sync). There is no link to /admin anywhere in the app —
// reachable only by typing the URL directly.
export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}

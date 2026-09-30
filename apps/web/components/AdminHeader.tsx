"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { performLogout } from "@/lib/logout";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/coaches", label: "Coaches" },
];

export default function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-6">
          <span className="font-heading text-sm font-semibold text-neutral-900">CoachevaOS Admin</span>
          <nav className="flex items-center gap-4">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    active ? "text-accent-600" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={performLogout}
          className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

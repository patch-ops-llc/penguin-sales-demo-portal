"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Users" },
  { href: "/admin/activity", label: "Access log" },
  { href: "/admin/runs", label: "Demo runs" },
  { href: "/admin/audit", label: "Admin audit" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1" aria-label="Admin">
      {TABS.map((tab) => {
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-[13.5px] font-medium ${active ? "bg-penguin text-white" : "text-[#3d3857] hover:bg-penguin-soft"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

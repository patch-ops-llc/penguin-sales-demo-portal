import type { Metadata } from "next";
import Link from "next/link";
import { PenguinLogo } from "@/components/brand";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#f6f5fb] font-penguin text-[#16122b]">
      <header className="border-b border-[#e4e2ee] bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-6 py-3">
          <PenguinLogo height={30} />
          <span className="rounded bg-penguin-soft px-2 py-0.5 text-[12px] font-semibold text-penguin">Demo Portal Admin</span>
          <AdminNav />
          <div className="ml-auto flex items-center gap-4 text-[13px]">
            <Link href="/account" className="text-[#5f5b73] underline-offset-2 hover:underline">
              {user.email}
            </Link>
            <Link href="/launchpad" className="font-medium text-penguin underline underline-offset-2">
              Back to demos
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-6 py-8">{children}</main>
    </div>
  );
}

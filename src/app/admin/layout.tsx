import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { AdminNav } from "@/app/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const db = createAdminClient();
  const [{ count: pending }, { count: reports }] = await Promise.all([
    db.from("games").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Shield className="size-7 text-primary" /> Admin
        </h1>
        <AdminNav pending={pending ?? 0} reports={reports ?? 0} />
      </header>
      {children}
    </div>
  );
}

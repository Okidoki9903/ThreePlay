"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNav({ pending, reports }: { pending: number; reports: number }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Queue", count: pending },
    { href: "/admin/games", label: "Games" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/reports", label: "Reports", count: reports },
  ];
  return (
    <nav className="inline-flex rounded-xl bg-muted p-1" aria-label="Admin">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition", active ? "bg-background shadow" : "text-muted-foreground hover:text-foreground")}
          >
            {l.label}
            {l.count ? <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{l.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { SORTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export function BrowseFilters({
  categories,
  tags,
  lockCategory,
}: {
  categories: Category[];
  tags: { tag: string; uses: number }[];
  lockCategory?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next}`, { scroll: false }));
  }

  const activeTag = params.get("tag");
  const q = params.get("q");

  return (
    <div className={cn("space-y-4 transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-3">
        {!lockCategory && (
          <NativeSelect
            aria-label="Category"
            value={params.get("category") ?? ""}
            onChange={(e) => update("category", e.target.value || null)}
            className="w-44"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        )}
        <NativeSelect aria-label="Sort by" value={params.get("sort") ?? "popular"} onChange={(e) => update("sort", e.target.value)} className="w-40">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        {q && (
          <button onClick={() => update("q", null)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-accent">
            “{q}” <X className="size-3.5" aria-label="Clear search" />
          </button>
        )}
      </div>
      {tags.length > 0 && (
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {tags.map((t) => {
            const active = activeTag === t.tag;
            return (
              <button key={t.tag} onClick={() => update("tag", active ? null : t.tag)} aria-pressed={active}>
                <Badge
                  variant={active ? "default" : "outline"}
                  className={cn("px-3 py-1 text-sm transition", !active && "hover:border-primary/50 hover:text-foreground")}
                >
                  #{t.tag}
                  {active && <X />}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

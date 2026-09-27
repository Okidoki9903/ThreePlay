import Link from "next/link";
import { CategoryIcon } from "@/components/layout/category-icon";
import type { Category } from "@/lib/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 md:grid-cols-5">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/categories/${c.slug}`}
          className="group relative flex min-w-36 shrink-0 items-center gap-3 overflow-hidden rounded-xl border bg-card px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-primary/40"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/25 to-glow/20 text-foreground transition group-hover:from-primary/40 group-hover:to-glow/30">
            <CategoryIcon name={c.icon} className="size-4" />
          </span>
          <span className="text-sm font-medium">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}

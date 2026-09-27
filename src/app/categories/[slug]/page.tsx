import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowseView, type BrowseSearchParams } from "@/components/browse/browse-view";
import { CategoryIcon } from "@/components/layout/category-icon";
import { getCategory } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<BrowseSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};
  return {
    title: `${category.name} games`,
    description: `Free ${category.name.toLowerCase()} games built with Three.js. ${category.description}`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-glow/20">
          <CategoryIcon name={category.icon} className="size-6" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
          <p className="mt-1 text-muted-foreground">{category.description}</p>
        </div>
      </header>
      <BrowseView searchParams={await searchParams} category={category.slug} />
    </div>
  );
}

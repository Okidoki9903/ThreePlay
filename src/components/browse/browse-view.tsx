import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { BrowseFilters } from "@/components/browse/browse-filters";
import { InfiniteGames } from "@/components/browse/infinite-games";
import { EmptyState } from "@/components/layout/section";
import { getCategories, getPopularTags, listGames } from "@/lib/queries";
import { parseSort } from "@/lib/constants";

export type BrowseSearchParams = { q?: string; tag?: string; category?: string; sort?: string };

export async function BrowseView({ searchParams, category }: { searchParams: BrowseSearchParams; category?: string }) {
  const filters = {
    q: searchParams.q?.slice(0, 80) || undefined,
    tag: searchParams.tag?.slice(0, 30) || undefined,
    category: category ?? (searchParams.category || undefined),
    sort: parseSort(searchParams.sort),
  };
  const [{ games, total, hasMore }, categories, tags] = await Promise.all([listGames(filters), getCategories(), getPopularTags(20)]);

  const query = new URLSearchParams(
    Object.entries(filters).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString();

  return (
    <div className="space-y-6">
      <Suspense>
        <BrowseFilters categories={categories} tags={tags} lockCategory={Boolean(category)} />
      </Suspense>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "game" : "games"}
      </p>
      {games.length === 0 ? (
        <EmptyState title="No games match your filters" icon={<SearchX />}>
          Try a different search term or clear some filters.
        </EmptyState>
      ) : (
        <InfiniteGames key={query} initialGames={games} initialHasMore={hasMore} query={query} />
      )}
    </div>
  );
}

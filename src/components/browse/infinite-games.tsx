"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { GameCard } from "@/components/game/game-card";
import { Button } from "@/components/ui/button";
import type { GameCardData } from "@/lib/types";

/**
 * Renders the server-provided first page, then fetches further pages from
 * /api/games when the sentinel scrolls into view (with a button fallback).
 */
export function InfiniteGames({
  initialGames,
  initialHasMore,
  query,
}: {
  initialGames: GameCardData[];
  initialHasMore: boolean;
  query: string;
}) {
  const [games, setGames] = useState(initialGames);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // Reset when filters change.
  useEffect(() => {
    setGames(initialGames);
    setHasMore(initialHasMore);
    setPage(1);
    setError(false);
  }, [initialGames, initialHasMore, query]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams(query);
      params.set("page", String(page + 1));
      const res = await fetch(`/api/games?${params}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { games: GameCardData[]; hasMore: boolean };
      setGames((prev) => {
        const seen = new Set(prev.map((g) => g.id));
        return [...prev, ...data.games.filter((g) => !seen.has(g.id))];
      });
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, query]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || error) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, hasMore, error]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {games.map((g, i) => (
          <GameCard key={g.id} game={g} priority={i < 4} />
        ))}
      </div>
      <div ref={sentinel} className="flex justify-center py-10" aria-live="polite">
        {loading && <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-label="Loading more games" />}
        {!loading && hasMore && (
          <Button variant="outline" onClick={loadMore}>
            {error ? "Retry" : "Load more"}
          </Button>
        )}
        {!hasMore && games.length > 0 && <p className="text-sm text-muted-foreground">You&apos;ve reached the end ✦</p>}
      </div>
    </>
  );
}

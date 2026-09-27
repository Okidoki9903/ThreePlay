import Link from "next/link";
import { Star } from "lucide-react";
import { GameCover } from "@/components/game/game-cover";
import { cn, formatCount, formatRating } from "@/lib/utils";
import type { GameCardData } from "@/lib/types";

type Entry = { game: GameCardData; value: number; count?: number };

const MEDALS = ["text-star", "text-zinc-300", "text-amber-600"];

export function LeaderboardList({ entries, unit, compact }: { entries: Entry[]; unit: "plays" | "rating"; compact?: boolean }) {
  if (entries.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing here yet this week.</p>;
  }
  return (
    <ol className="divide-y divide-border/60">
      {entries.map((e, i) => (
        <li key={e.game.id}>
          <Link href={`/games/${e.game.slug}`} className="group flex items-center gap-3 rounded-lg p-2.5 transition hover:bg-accent/60">
            <span className={cn("w-6 text-center text-sm font-bold tabular-nums", MEDALS[i] ?? "text-muted-foreground")}>{i + 1}</span>
            <div className={cn("relative shrink-0 overflow-hidden rounded-md bg-muted", compact ? "h-10 w-16" : "h-12 w-20")}>
              <GameCover src={e.game.cover_url} alt="" fill sizes="80px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium group-hover:text-primary">{e.game.title}</p>
              <p className="truncate text-xs text-muted-foreground">{e.game.developer_name}</p>
            </div>
            <div className="shrink-0 text-right text-sm tabular-nums">
              {unit === "plays" ? (
                <>
                  <span className="font-semibold">{formatCount(e.value)}</span>
                  <span className="block text-xs text-muted-foreground">plays</span>
                </>
              ) : (
                <>
                  <span className="flex items-center justify-end gap-1 font-semibold">
                    <Star className="size-3.5 fill-star text-star" /> {formatRating(e.value)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {e.count} {e.count === 1 ? "rating" : "ratings"}
                  </span>
                </>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

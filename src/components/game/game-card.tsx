import Link from "next/link";
import { Play, Star, Users } from "lucide-react";
import { GameCover } from "@/components/game/game-cover";
import { Badge } from "@/components/ui/badge";
import { cn, formatCount, formatRating } from "@/lib/utils";
import type { GameCardData } from "@/lib/types";

export function GameCard({
  game,
  priority,
  rank,
  className,
}: {
  game: GameCardData & { weekly_plays?: number };
  priority?: boolean;
  rank?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_40px_-20px_var(--primary)] focus-visible:-translate-y-1",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <GameCover
          src={game.cover_url}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent opacity-80" />
        <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid size-14 place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-lg shadow-primary/40 backdrop-blur">
            <Play className="size-6 translate-x-0.5 fill-current" />
          </span>
        </div>
        {rank !== undefined && (
          <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-lg bg-background/80 text-sm font-bold backdrop-blur">
            {rank}
          </span>
        )}
        {game.is_featured && rank === undefined && (
          <Badge className="absolute left-3 top-3 bg-background/80 backdrop-blur">Featured</Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold tracking-tight group-hover:text-primary">{game.title}</h3>
          {game.rating_count > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="size-3.5 fill-star text-star" />
              {formatRating(game.rating_avg)}
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{game.short_description}</p>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span className="truncate">by {game.developer_name}</span>
          <span className="flex shrink-0 items-center gap-1" title="Plays">
            <Users className="size-3.5" />
            {formatCount(game.weekly_plays ?? game.play_count)}
            {game.weekly_plays !== undefined && <span className="hidden sm:inline">this week</span>}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function GameGrid({ games, className }: { games: (GameCardData & { weekly_plays?: number })[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4", className)}>
      {games.map((g, i) => (
        <GameCard key={g.id} game={g} priority={i < 4} />
      ))}
    </div>
  );
}

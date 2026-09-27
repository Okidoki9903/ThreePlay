import { GameGridSkeleton } from "@/components/game/game-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <Skeleton className="h-10 w-64" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-40" />
      </div>
      <GameGridSkeleton count={12} />
    </div>
  );
}

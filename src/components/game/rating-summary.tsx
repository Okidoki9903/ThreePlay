import { Stars } from "@/components/game/stars";
import { formatRating } from "@/lib/utils";

export function RatingSummary({ avg, count, distribution }: { avg: number; count: number; distribution: number[] }) {
  const max = Math.max(1, ...distribution);
  return (
    <div className="flex items-center gap-6 rounded-xl border bg-card p-5">
      <div className="text-center">
        <p className="text-5xl font-semibold tracking-tight tabular-nums">{count ? formatRating(avg) : "–"}</p>
        <Stars value={avg} size={16} className="mt-2" />
        <p className="mt-1 text-xs text-muted-foreground">
          {count} {count === 1 ? "rating" : "ratings"}
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-2 text-muted-foreground">{n}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-star/70 to-star" style={{ width: `${(distribution[n - 1]! / max) * 100}%` }} />
            </div>
            <span className="w-6 text-right tabular-nums text-muted-foreground">{distribution[n - 1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

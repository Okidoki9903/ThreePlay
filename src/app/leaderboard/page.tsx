import type { Metadata } from "next";
import { Flame, Star, Trophy } from "lucide-react";
import { LeaderboardList } from "@/components/game/leaderboard-list";
import { getLeaderboards } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The most played and highest rated Three.js games this week.",
  alternates: { canonical: "/leaderboard" },
};

export default async function LeaderboardPage() {
  const boards = await getLeaderboards(10);
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          <Trophy className="size-8 text-star" /> Leaderboard
        </h1>
        <p className="mt-2 text-muted-foreground">Rolling 7-day rankings, updated continuously.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <Board title="Most played this week" icon={<Flame className="size-4 text-orange-400" />}>
          <LeaderboardList entries={boards.weeklyPlayed} unit="plays" />
        </Board>
        <Board title="Highest rated this week" icon={<Star className="size-4 fill-star text-star" />}>
          <LeaderboardList entries={boards.weeklyRated} unit="rating" />
        </Board>
        <Board title="Most played all time" icon={<Trophy className="size-4 text-glow" />}>
          <LeaderboardList entries={boards.allTimePlayed} unit="plays" />
        </Board>
      </div>
    </div>
  );
}

function Board({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card">
      <h2 className="flex items-center gap-2 border-b px-5 py-4 font-semibold">
        {icon} {title}
      </h2>
      <div className="p-2">{children}</div>
    </section>
  );
}

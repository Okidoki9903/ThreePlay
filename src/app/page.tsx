import Link from "next/link";
import { Clock, Flame, Star, Trophy } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { Section, EmptyState } from "@/components/layout/section";
import { GameGrid } from "@/components/game/game-card";
import { LeaderboardList } from "@/components/game/leaderboard-list";
import { FadeIn } from "@/components/layout/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCategories,
  getFeaturedGames,
  getLeaderboards,
  getNewGames,
  getPopularTags,
  getTopRatedGames,
  getTrendingGames,
  listGames,
} from "@/lib/queries";

export default async function HomePage() {
  const [featured, trending, fresh, topRated, categories, tags, boards, all] = await Promise.all([
    getFeaturedGames(1),
    getTrendingGames(8),
    getNewGames(8),
    getTopRatedGames(4),
    getCategories(),
    getPopularTags(16),
    getLeaderboards(5),
    listGames({ pageSize: 1 }),
  ]);

  return (
    <>
      <Hero featured={featured[0] ?? null} totalGames={all.total} />

      <div className="mx-auto max-w-7xl space-y-16 px-4 pt-12 sm:px-6">
        <FadeIn>
          <Section title="Categories">
            <CategoryGrid categories={categories} />
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="Trending this week" subtitle="Most played in the last 7 days" href="/leaderboard" icon={<Flame className="size-5 text-orange-400" />}>
            {trending.length ? <GameGrid games={trending} /> : <EmptyState title="No games yet" />}
          </Section>
        </FadeIn>

        <FadeIn>
          <Section title="New releases" subtitle="Fresh from the community" href="/games?sort=new" icon={<Clock className="size-5 text-glow" />}>
            {fresh.length ? <GameGrid games={fresh} /> : <EmptyState title="No games yet" />}
          </Section>
        </FadeIn>

        <FadeIn>
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <Section title="Top rated" href="/games?sort=top" icon={<Star className="size-5 fill-star text-star" />}>
              {topRated.length ? (
                <GameGrid games={topRated} className="md:grid-cols-2 xl:grid-cols-2" />
              ) : (
                <EmptyState title="No ratings yet">Be the first to rate a game!</EmptyState>
              )}
            </Section>
            <Section title="This week" href="/leaderboard" icon={<Trophy className="size-5 text-star" />}>
              <div className="rounded-xl border bg-card p-2">
                <LeaderboardList entries={boards.weeklyPlayed} unit="plays" compact />
              </div>
            </Section>
          </div>
        </FadeIn>

        {tags.length > 0 && (
          <FadeIn>
            <Section title="Popular tags">
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link key={t.tag} href={`/games?tag=${encodeURIComponent(t.tag)}`}>
                    <Badge variant="outline" className="px-3 py-1 text-sm transition hover:border-primary/50 hover:text-foreground">
                      #{t.tag} <span className="text-muted-foreground/60">{t.uses}</span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </Section>
          </FadeIn>
        )}

        <FadeIn>
          <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/20 via-card to-glow/10 p-8 sm:p-12">
            <div className="bg-grid absolute inset-0 -z-10 opacity-50" />
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Made something with Three.js?</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Share it with players who love 3D on the web. Paste a URL or upload a static build — we&apos;ll host it for free.
            </p>
            <Button asChild variant="glow" size="lg" className="mt-6">
              <Link href="/submit">Submit your game</Link>
            </Button>
          </section>
        </FadeIn>
      </div>
    </>
  );
}

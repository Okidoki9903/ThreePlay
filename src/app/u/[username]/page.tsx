import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Globe, Heart, MessageSquare, Settings, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameGrid } from "@/components/game/game-card";
import { GameCover } from "@/components/game/game-cover";
import { Stars } from "@/components/game/stars";
import { EmptyState } from "@/components/layout/section";
import { UserAvatar } from "@/components/layout/user-menu";
import { getSession } from "@/lib/auth";
import { getProfileActivity, getProfileByUsername } from "@/lib/queries";
import { formatDate, timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfileByUsername((await params).username);
  if (!profile) return { title: "Player not found" };
  return {
    title: `${profile.display_name ?? profile.username} (@${profile.username})`,
    description: profile.bio ?? `${profile.username}'s favorite Three.js games and reviews on ThreePlay.`,
  };
}

const STATUS_VARIANT = { approved: "success", pending: "warning", rejected: "destructive" } as const;

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfileByUsername((await params).username);
  if (!profile) notFound();
  const { user } = await getSession();
  const isOwner = user?.id === profile.id;
  const activity = await getProfileActivity(profile.id, isOwner);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="relative mb-10 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-glow/10 p-6 sm:p-8">
        <div className="bg-grid absolute inset-0 -z-10 opacity-40" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar profile={profile} className="size-20 text-xl ring-2 ring-primary/40" />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.display_name ?? profile.username}
              {profile.role === "admin" && <Badge>Moderator</Badge>}
            </h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="max-w-2xl pt-1 text-sm">{profile.bio}</p>}
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" /> Joined {formatDate(profile.created_at)}
              </span>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 hover:text-foreground">
                  <Globe className="size-3.5" /> {profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
          {isOwner && (
            <Button asChild variant="outline" size="sm" className="glass self-start">
              <Link href="/settings">
                <Settings /> Edit profile
              </Link>
            </Button>
          )}
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
          {[
            ["Favorites", activity.favorites.length],
            ["Reviews", activity.reviews.length],
            ["Games", activity.submitted.filter((g) => g.status === "approved").length],
          ].map(([label, n]) => (
            <div key={label} className="rounded-xl bg-background/50 p-3 text-center">
              <dd className="text-xl font-semibold tabular-nums">{n}</dd>
              <dt className="text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </header>

      <Tabs defaultValue={isOwner ? "played" : "favorites"}>
        <TabsList>
          {isOwner && (
            <TabsTrigger value="played">
              <Clock className="size-4" /> Recently played
            </TabsTrigger>
          )}
          <TabsTrigger value="favorites">
            <Heart className="size-4" /> Favorites
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <MessageSquare className="size-4" /> Ratings
          </TabsTrigger>
          <TabsTrigger value="submitted">
            <Upload className="size-4" /> Submitted
          </TabsTrigger>
        </TabsList>

        {isOwner && (
          <TabsContent value="played">
            {activity.played.length ? (
              <GameGrid games={activity.played} />
            ) : (
              <EmptyState title="Nothing played yet">
                <Link href="/games" className="text-primary hover:underline">
                  Find something to play →
                </Link>
              </EmptyState>
            )}
            <p className="mt-4 text-xs text-muted-foreground">Only you can see your play history.</p>
          </TabsContent>
        )}

        <TabsContent value="favorites">
          {activity.favorites.length ? <GameGrid games={activity.favorites} /> : <EmptyState title="No favorites yet" icon={<Heart />} />}
        </TabsContent>

        <TabsContent value="reviews">
          {activity.reviews.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {activity.reviews.map((r) =>
                r.game ? (
                  <li key={r.id}>
                    <Link href={`/games/${r.game.slug}`} className="flex gap-4 rounded-xl border bg-card p-3 transition hover:border-primary/40">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <GameCover src={r.game.cover_url} alt="" fill sizes="96px" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{r.game.title}</p>
                        <div className="flex items-center gap-2">
                          <Stars value={r.rating} size={12} />
                          <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                          {r.is_hidden && <Badge variant="destructive">Hidden</Badge>}
                        </div>
                        {r.body && <p className="line-clamp-2 text-sm text-muted-foreground">{r.body}</p>}
                      </div>
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          ) : (
            <EmptyState title="No ratings yet" icon={<MessageSquare />} />
          )}
        </TabsContent>

        <TabsContent value="submitted">
          {activity.submitted.length ? (
            isOwner ? (
              <ul className="space-y-3">
                {activity.submitted.map((g) => (
                  <li key={g.id}>
                    <Link href={`/games/${g.slug}`} className="flex items-center gap-4 rounded-xl border bg-card p-3 transition hover:border-primary/40">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <GameCover src={g.cover_url} alt="" fill sizes="96px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{g.title}</p>
                        <p className="truncate text-sm text-muted-foreground">{g.rejection_reason ? `Reason: ${g.rejection_reason}` : g.short_description}</p>
                      </div>
                      <Badge variant={STATUS_VARIANT[g.status]} className="capitalize">
                        {g.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <GameGrid games={activity.submitted} />
            )
          ) : (
            <EmptyState title="No games submitted" icon={<Upload />}>
              {isOwner && (
                <Link href="/submit" className="text-primary hover:underline">
                  Submit your first game →
                </Link>
              )}
            </EmptyState>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

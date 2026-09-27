import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Code2, ExternalLink, Gamepad2, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { GamePlayer } from "@/components/game/game-player";
import { ScreenshotCarousel } from "@/components/game/screenshot-carousel";
import { FavoriteButton } from "@/components/game/favorite-button";
import { ShareButton } from "@/components/game/share-button";
import { ReportDialog } from "@/components/game/report-dialog";
import { ShortcutsDialog } from "@/components/game/shortcuts-dialog";
import { RatingSummary } from "@/components/game/rating-summary";
import { ReviewForm } from "@/components/game/review-form";
import { ReviewList } from "@/components/game/review-list";
import { Stars } from "@/components/game/stars";
import { GameGrid } from "@/components/game/game-card";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth";
import {
  getFavoriteCount,
  getGameBySlug,
  getRatingDistribution,
  getRelatedGames,
  getReviews,
  getViewerState,
} from "@/lib/queries";
import { env } from "@/lib/env";
import { SITE } from "@/lib/constants";
import { formatCount, formatDate, formatRating } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

function absolute(url: string) {
  return url.startsWith("http") ? url : `${env.siteUrl}${url}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = await getGameBySlug((await params).slug);
  if (!game) return { title: "Game not found" };
  const title = `${game.title} — play free in your browser`;
  const image = absolute(game.cover_url);
  return {
    title,
    description: game.short_description,
    alternates: { canonical: `/games/${game.slug}` },
    robots: game.status === "approved" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      title: game.title,
      description: game.short_description,
      url: `/games/${game.slug}`,
      images: [{ url: image, width: 1200, height: 750, alt: game.title }],
      siteName: SITE.name,
    },
    twitter: { card: "summary_large_image", title: game.title, description: game.short_description, images: [image] },
  };
}

export default async function GamePage({ params }: Props) {
  const game = await getGameBySlug((await params).slug);
  if (!game) notFound();

  const { user, profile } = await getSession();
  const [reviews, distribution, viewer, favCount, related] = await Promise.all([
    getReviews(game.id),
    getRatingDistribution(game.id),
    getViewerState(game.id, user?.id),
    getFavoriteCount(game.id),
    getRelatedGames(game.id, game.category_slug),
  ]);

  const approved = game.status === "approved";
  const url = `${env.siteUrl}/games/${game.slug}`;
  const loginHref = `/login?next=${encodeURIComponent(`/games/${game.slug}`)}`;
  const screenshots = [...new Set(game.screenshots.length ? game.screenshots : [game.cover_url])];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.short_description,
    url,
    image: absolute(game.cover_url),
    genre: game.category?.name,
    keywords: game.tags.join(", "),
    datePublished: game.released_at,
    gamePlatform: "Web browser",
    applicationCategory: "Game",
    operatingSystem: "Any",
    author: { "@type": "Person", name: game.developer_name, url: game.developer_url ?? undefined },
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    ...(game.rating_count > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: game.rating_avg, ratingCount: game.rating_count, bestRating: 5, worstRating: 1 },
    }),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {!approved && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <p className="font-medium">
              This game is {game.status === "pending" ? "awaiting review" : "rejected"} and only visible to you
              {profile?.role === "admin" ? " (admin)" : ""}.
            </p>
            {game.rejection_reason && <p className="mt-1 text-muted-foreground">Reason: {game.rejection_reason}</p>}
          </div>
        </div>
      )}

      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/games" className="hover:text-foreground">
          Games
        </Link>
        <span>/</span>
        {game.category && (
          <>
            <Link href={`/categories/${game.category.slug}`} className="hover:text-foreground">
              {game.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="truncate text-foreground">{game.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <GamePlayer game={game} countPlays={approved} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{game.title}</h1>
              <p className="text-muted-foreground">{game.short_description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Stars value={game.rating_avg} />
                  <span className="text-foreground">{game.rating_count ? formatRating(game.rating_avg) : "No ratings"}</span>
                  {game.rating_count > 0 && <span>({game.rating_count})</span>}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-4" /> {formatCount(game.play_count)} plays
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <FavoriteButton gameId={game.id} initial={viewer.isFavorite} count={favCount} signedIn={Boolean(user)} />
              <ShareButton url={url} title={game.title} />
              <ShortcutsDialog gameId={game.id} />
            </div>
          </div>

          <section className="space-y-4" aria-labelledby="about">
            <h2 id="about" className="text-lg font-semibold">
              About this game
            </h2>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              {(game.long_description || game.short_description).split(/\n{2,}/).map((p, i) => (
                <p key={i} className="whitespace-pre-line break-words">
                  {p}
                </p>
              ))}
            </div>
          </section>

          {screenshots.length > 0 && (
            <section className="space-y-4" aria-labelledby="media">
              <h2 id="media" className="text-lg font-semibold">
                Screenshots
              </h2>
              <ScreenshotCarousel images={screenshots} title={game.title} />
            </section>
          )}

          <section className="space-y-5" aria-labelledby="reviews">
            <h2 id="reviews" className="text-lg font-semibold">
              Ratings &amp; reviews
            </h2>
            <RatingSummary avg={game.rating_avg} count={game.rating_count} distribution={distribution} />
            {approved && <ReviewForm key={viewer.review?.updated_at ?? "new"} gameId={game.id} existing={viewer.review} signedIn={Boolean(user)} loginHref={loginHref} />}
            <ReviewList reviews={reviews} gameId={game.id} signedIn={Boolean(user)} viewerId={user?.id} />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-xl border bg-card p-5">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Developer</dt>
              <dd className="truncate text-right font-medium">
                {game.developer_url ? (
                  <a href={game.developer_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 hover:text-primary">
                    {game.developer_name} <ExternalLink className="size-3" />
                  </a>
                ) : (
                  game.developer_name
                )}
              </dd>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-3.5" /> Released
              </dt>
              <dd className="text-right">{formatDate(game.released_at)}</dd>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" /> Added
              </dt>
              <dd className="text-right">{formatDate(game.created_at)}</dd>
              {game.category && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Gamepad2 className="size-3.5" /> Category
                  </dt>
                  <dd className="text-right">
                    <Link href={`/categories/${game.category.slug}`} className="hover:text-primary">
                      {game.category.name}
                    </Link>
                  </dd>
                </>
              )}
              {game.submitter && (
                <>
                  <dt className="text-muted-foreground">Submitted by</dt>
                  <dd className="truncate text-right">
                    <Link href={`/u/${game.submitter.username}`} className="hover:text-primary">
                      @{game.submitter.username}
                    </Link>
                  </dd>
                </>
              )}
            </dl>
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {game.threejs_detected ? (
                <Badge variant="success">
                  <ShieldCheck /> Three.js{game.threejs_revision ? ` r${game.threejs_revision}` : ""} detected
                </Badge>
              ) : (
                <Badge variant="outline">Three.js (self-declared)</Badge>
              )}
              {game.is_hosted && <Badge variant="secondary">Hosted on ThreePlay</Badge>}
            </div>
            {game.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {game.tags.map((t) => (
                  <Link key={t} href={`/games?tag=${encodeURIComponent(t)}`}>
                    <Badge variant="outline" className="transition hover:border-primary/50 hover:text-foreground">
                      #{t}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            {game.source_url && (
              <a href={game.source_url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Code2 className="size-4" /> View source
              </a>
            )}
          </div>

          {game.controls && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Controls</h2>
              <ul className="space-y-2 text-sm">
                {game.controls
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => {
                    const [keys, ...rest] = line.split(/\s+[—–-]\s+/);
                    return (
                      <li key={i} className="flex items-start justify-between gap-3">
                        {rest.length ? (
                          <>
                            <kbd className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs">{keys}</kbd>
                            <span className="text-right text-muted-foreground">{rest.join(" - ")}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{line}</span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <ReportDialog gameId={game.id} signedIn={Boolean(user)} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <Section title="You might also like" className="mt-16">
          <GameGrid games={related} />
        </Section>
      )}
    </div>
  );
}

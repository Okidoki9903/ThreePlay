import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type SortValue } from "@/lib/constants";
import type { GameCardData, ReviewWithAuthor } from "@/lib/types";

export const GAME_CARD_FIELDS =
  "id, slug, title, short_description, cover_url, category_slug, tags, developer_name, play_count, rating_avg, rating_count, created_at, is_featured";

const REVIEW_WITH_AUTHOR = "*, author:profiles!reviews_user_id_fkey(username, display_name, avatar_url)";

/** Strip characters that have meaning in PostgREST filter syntax. */
function sanitizeSearch(q: string) {
  return q.replace(/[,()%*:"'\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Fetch cards for ids while preserving the given order. */
async function gamesByIds(ids: string[]): Promise<GameCardData[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("games").select(GAME_CARD_FIELDS).in("id", ids).eq("status", "approved");
  const byId = new Map((data ?? []).map((g) => [g.id, g]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export const getCategories = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return data ?? [];
});

export const getCategory = cache(async (slug: string) => {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
});

export async function getFeaturedGames(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("*")
    .eq("status", "approved")
    .eq("is_featured", true)
    .order("featured_at", { ascending: false })
    .limit(limit);
  if (data && data.length > 0) return data;
  // Nothing featured yet: fall back to the most played games.
  const { data: fallback } = await supabase
    .from("games")
    .select("*")
    .eq("status", "approved")
    .order("play_count", { ascending: false })
    .limit(1);
  return fallback ?? [];
}

export async function getTrendingGames(limit = 8): Promise<(GameCardData & { weekly_plays?: number })[]> {
  const supabase = await createClient();
  const { data: ranking } = await supabase.rpc("trending_games", { p_days: 7, p_limit: limit });
  if (ranking && ranking.length > 0) {
    const plays = new Map(ranking.map((r) => [r.game_id, Number(r.plays)]));
    const games = await gamesByIds(ranking.map((r) => r.game_id));
    return games.map((g) => ({ ...g, weekly_plays: plays.get(g.id) }));
  }
  const { data } = await supabase
    .from("games")
    .select(GAME_CARD_FIELDS)
    .eq("status", "approved")
    .order("play_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getNewGames(limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select(GAME_CARD_FIELDS)
    .eq("status", "approved")
    .order("approved_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getTopRatedGames(limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select(GAME_CARD_FIELDS)
    .eq("status", "approved")
    .gt("rating_count", 0)
    .order("rating_avg", { ascending: false })
    .order("rating_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export type ListGamesParams = {
  q?: string;
  tag?: string;
  category?: string;
  sort?: SortValue;
  page?: number;
  pageSize?: number;
};

export async function listGames({ q, tag, category, sort = "popular", page = 1, pageSize = PAGE_SIZE }: ListGamesParams) {
  const supabase = await createClient();
  let query = supabase.from("games").select(GAME_CARD_FIELDS, { count: "exact" }).eq("status", "approved");

  const term = q ? sanitizeSearch(q) : "";
  if (term) {
    // Full-text match (stemmed, weighted) OR plain substring match on the title.
    const tag = term.toLowerCase().replace(/\s+/g, "-");
    // Values are double-quoted so dots and spaces are not parsed as filter syntax.
    query = query.or(`search.wfts(english)."${term}",title.ilike."%${term}%",tags.cs.{"${tag}"}`);
  }
  if (tag) query = query.contains("tags", [tag]);
  if (category) query = query.eq("category_slug", category);

  switch (sort) {
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    case "top":
      query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
      break;
    case "az":
      query = query.order("title", { ascending: true });
      break;
    default:
      query = query.order("play_count", { ascending: false });
  }
  query = query.order("id");

  const from = (Math.max(1, page) - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  // PGRST103 = page past the end (infinite scroll overshoot) — not an error.
  if (error && error.code !== "PGRST103") console.error("listGames", error.message);
  const total = count ?? 0;
  return { games: data ?? [], total, hasMore: from + pageSize < total };
}

export const getGameBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("*, category:categories(slug, name), submitter:profiles!games_submitted_by_fkey(username, display_name)")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export async function getReviews(gameId: string, limit = 20): Promise<ReviewWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_WITH_AUTHOR)
    .eq("game_id", gameId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRatingDistribution(gameId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("rating").eq("game_id", gameId).eq("is_hidden", false);
  const dist = [0, 0, 0, 0, 0];
  for (const r of data ?? []) dist[r.rating - 1]! += 1;
  return dist;
}

export async function getViewerState(gameId: string, userId: string | undefined) {
  if (!userId) return { review: null, isFavorite: false };
  const supabase = await createClient();
  const [{ data: review }, { data: fav }] = await Promise.all([
    supabase.from("reviews").select("*").eq("game_id", gameId).eq("user_id", userId).maybeSingle(),
    supabase.from("favorites").select("game_id").eq("game_id", gameId).eq("user_id", userId).maybeSingle(),
  ]);
  return { review, isFavorite: Boolean(fav) };
}

export async function getFavoriteCount(gameId: string) {
  const supabase = await createClient();
  const { count } = await supabase.from("favorites").select("game_id", { count: "exact", head: true }).eq("game_id", gameId);
  return count ?? 0;
}

export async function getRelatedGames(gameId: string, categorySlug: string, limit = 4) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select(GAME_CARD_FIELDS)
    .eq("status", "approved")
    .eq("category_slug", categorySlug)
    .neq("id", gameId)
    .order("play_count", { ascending: false })
    .limit(limit);
  if (data && data.length >= limit) return data;
  const exclude = [gameId, ...(data ?? []).map((g) => g.id)];
  const { data: more } = await supabase
    .from("games")
    .select(GAME_CARD_FIELDS)
    .eq("status", "approved")
    .not("id", "in", `(${exclude.join(",")})`)
    .order("rating_avg", { ascending: false })
    .limit(limit - (data?.length ?? 0));
  return [...(data ?? []), ...(more ?? [])];
}

export async function getLeaderboards(limit = 10) {
  const supabase = await createClient();
  const [{ data: played }, { data: rated }, { data: allTime }] = await Promise.all([
    supabase.rpc("trending_games", { p_days: 7, p_limit: limit }),
    supabase.rpc("top_rated_recent", { p_days: 7, p_limit: limit, p_min_ratings: 1 }),
    supabase
      .from("games")
      .select(GAME_CARD_FIELDS)
      .eq("status", "approved")
      .order("play_count", { ascending: false })
      .limit(limit),
  ]);

  const [playedGames, ratedGames] = await Promise.all([
    gamesByIds((played ?? []).map((r) => r.game_id)),
    gamesByIds((rated ?? []).map((r) => r.game_id)),
  ]);
  const playsMap = new Map((played ?? []).map((r) => [r.game_id, Number(r.plays)]));
  const ratedMap = new Map((rated ?? []).map((r) => [r.game_id, r]));

  return {
    weeklyPlayed: playedGames.map((g) => ({ game: g, value: playsMap.get(g.id) ?? 0 })),
    weeklyRated: ratedGames.map((g) => {
      const r = ratedMap.get(g.id);
      return { game: g, value: Number(r?.avg_rating ?? 0), count: Number(r?.ratings ?? 0) };
    }),
    allTimePlayed: (allTime ?? []).map((g) => ({ game: g, value: g.play_count })),
  };
}

export async function getPopularTags(limit = 24) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("popular_tags", { p_limit: limit });
  return (data ?? []).map((t) => ({ tag: t.tag, uses: Number(t.uses) }));
}

export const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
  return data;
});

export async function getProfileActivity(userId: string, isOwner: boolean) {
  const supabase = await createClient();
  const [favorites, reviews, submitted, plays] = await Promise.all([
    supabase
      .from("favorites")
      .select(`created_at, game:games(${GAME_CARD_FIELDS})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(48),
    supabase
      .from("reviews")
      .select("*, game:games(slug, title, cover_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    (() => {
      let q = supabase
        .from("games")
        .select(`${GAME_CARD_FIELDS}, status, rejection_reason`)
        .eq("submitted_by", userId)
        .order("created_at", { ascending: false });
      if (!isOwner) q = q.eq("status", "approved");
      return q;
    })(),
    // RLS only returns plays for the signed-in owner, so this is empty for visitors.
    isOwner
      ? supabase
          .from("plays")
          .select("game_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as { game_id: string; created_at: string }[] }),
  ]);

  // Unique recently-played games, most recent first.
  const seen = new Set<string>();
  const playedIds: string[] = [];
  for (const p of plays.data ?? []) {
    if (!seen.has(p.game_id)) {
      seen.add(p.game_id);
      playedIds.push(p.game_id);
    }
  }
  const played = await gamesByIds(playedIds.slice(0, 48));

  return {
    favorites: (favorites.data ?? []).flatMap((f) => (f.game ? [f.game] : [])),
    reviews: reviews.data ?? [],
    submitted: submitted.data ?? [],
    played,
  };
}

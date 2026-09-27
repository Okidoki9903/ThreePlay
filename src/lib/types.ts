import type { Tables } from "@/lib/database.types";

export type Game = Tables<"games">;
export type Profile = Tables<"profiles">;
export type Category = Tables<"categories">;
export type Review = Tables<"reviews">;

/** Fields needed to render a game card. */
export type GameCardData = Pick<
  Game,
  | "id"
  | "slug"
  | "title"
  | "short_description"
  | "cover_url"
  | "category_slug"
  | "tags"
  | "developer_name"
  | "play_count"
  | "rating_avg"
  | "rating_count"
  | "created_at"
  | "is_featured"
>;

export type ReviewWithAuthor = Review & {
  author: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};

export type ActionResult<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

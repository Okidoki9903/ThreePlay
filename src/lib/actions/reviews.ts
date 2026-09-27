"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

async function revalidateGame(gameId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("slug").eq("id", gameId).maybeSingle();
  if (data) revalidatePath(`/games/${data.slug}`);
}

/** Create or update the viewer's single review for a game. */
export async function saveReview(input: { gameId: string; rating: number; body?: string }): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Sign in to rate games" };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review" };
  const { gameId, rating, body } = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("reviews").update({ rating, body }).eq("id", existing.id)
    : await supabase.from("reviews").insert({ game_id: gameId, user_id: user.id, rating, body });

  if (error) {
    console.error("saveReview", error);
    return { ok: false, error: "Could not save your review" };
  }
  await revalidateGame(gameId);
  return { ok: true, message: existing ? "Review updated" : "Thanks for rating!" };
}

export async function deleteMyReview(gameId: string): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Not signed in" };
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("game_id", gameId).eq("user_id", user.id);
  if (error) return { ok: false, error: "Could not delete your review" };
  await revalidateGame(gameId);
  return { ok: true, message: "Review deleted" };
}

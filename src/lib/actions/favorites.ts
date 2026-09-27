"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export async function toggleFavorite(gameId: string, favorite: boolean): Promise<ActionResult<{ favorite: boolean }>> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Sign in to save favorites" };
  const supabase = await createClient();
  const { error } = favorite
    ? await supabase.from("favorites").upsert({ user_id: user.id, game_id: gameId }, { ignoreDuplicates: true })
    : await supabase.from("favorites").delete().eq("user_id", user.id).eq("game_id", gameId);
  if (error) return { ok: false, error: "Could not update favorites" };
  return { ok: true, data: { favorite } };
}

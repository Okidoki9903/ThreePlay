"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function createReport(input: {
  gameId: string;
  reviewId?: string;
  reason: string;
  details?: string;
}): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Sign in to report content" };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid report" };

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    game_id: parsed.data.gameId,
    review_id: parsed.data.reviewId ?? null,
    reason: parsed.data.reason,
    details: parsed.data.details,
    reporter_id: user.id,
  });
  if (error) return { ok: false, error: "Could not send the report" };
  return { ok: true, message: "Thanks — a moderator will take a look." };
}

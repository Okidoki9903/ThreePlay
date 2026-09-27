"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Recursively delete every object under a storage prefix. */
async function removeFolder(db: AdminClient, bucket: string, prefix: string): Promise<void> {
  const { data: entries } = await db.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!entries?.length) return;
  // Folders are returned with a null id.
  const files = entries.filter((e) => e.id !== null).map((e) => `${prefix}/${e.name}`);
  const folders = entries.filter((e) => e.id === null).map((e) => `${prefix}/${e.name}`);
  if (files.length) await db.storage.from(bucket).remove(files);
  await Promise.all(folders.map((f) => removeFolder(db, bucket, f)));
  if (entries.length === 1000) await removeFolder(db, bucket, prefix);
}

function refresh(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/games/${slug}`);
}

export async function approveGame(gameId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db
    .from("games")
    .update({ status: "approved", approved_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", gameId)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  refresh(data.slug);
  return { ok: true, message: "Game approved" };
}

export async function rejectGame(gameId: string, reason: string): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db
    .from("games")
    .update({ status: "rejected", rejection_reason: reason.trim().slice(0, 500) || "Did not meet submission guidelines", is_featured: false })
    .eq("id", gameId)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  refresh(data.slug);
  return { ok: true, message: "Game rejected" };
}

export async function setFeatured(gameId: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db
    .from("games")
    .update({ is_featured: featured, featured_at: featured ? new Date().toISOString() : null })
    .eq("id", gameId)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  refresh(data.slug);
  return { ok: true, message: featured ? "Now featured" : "Removed from featured" };
}

export async function deleteGame(gameId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: game } = await db.from("games").select("is_hosted").eq("id", gameId).maybeSingle();
  const { error } = await db.from("games").delete().eq("id", gameId);
  if (error) return { ok: false, error: error.message };
  if (game?.is_hosted) await removeFolder(db, "game-builds", gameId);
  refresh();
  return { ok: true, message: "Game deleted" };
}

export async function setReviewHidden(reviewId: string, hidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db
    .from("reviews")
    .update({ is_hidden: hidden })
    .eq("id", reviewId)
    .select("game:games(slug)")
    .single();
  if (error) return { ok: false, error: error.message };
  refresh(data.game?.slug);
  return { ok: true, message: hidden ? "Review hidden" : "Review restored" };
}

export async function adminDeleteReview(reviewId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("reviews").delete().eq("id", reviewId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: "Review deleted" };
}

export async function resolveReport(reportId: string, status: "resolved" | "dismissed"): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("reports")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reports");
  return { ok: true, message: `Report ${status}` };
}

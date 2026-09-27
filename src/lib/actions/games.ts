"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { detectThreeJs, type DetectionResult } from "@/lib/detect-threejs";
import { extractHostedBuild } from "@/lib/hosted-build";
import { submitGameSchema, type SubmitGameInput } from "@/lib/validation";
import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

/** Count a play. Signed-in users are de-duplicated in SQL, anonymous ones via a cookie. */
export async function recordPlay(gameId: string): Promise<void> {
  const jar = await cookies();
  const key = `tp_p_${gameId.slice(0, 8)}`;
  if (jar.get(key)) return;
  const supabase = await createClient();
  await supabase.rpc("record_play", { p_game_id: gameId });
  jar.set(key, "1", { maxAge: 60 * 30, httpOnly: true, sameSite: "lax", path: "/" });
}

export async function detectGameUrl(url: string): Promise<ActionResult<DetectionResult>> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Sign in to use auto-detection" };
  return { ok: true, data: await detectThreeJs(url) };
}

function mediaPrefix(userId: string) {
  return `${env.supabaseUrl}/storage/v1/object/public/game-media/${userId}/`;
}

async function uniqueSlug(title: string) {
  const supabase = await createClient();
  const base = slugify(title) || "game";
  const { data } = await supabase.from("games").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((g) => g.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function submitGame(input: SubmitGameInput): Promise<ActionResult<{ slug: string }>> {
  const { user, profile } = await getSession();
  if (!user || !profile) return { ok: false, error: "You need to be signed in" };

  const parsed = submitGameSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, error: "Please fix the highlighted fields", fieldErrors };
  }
  const v = parsed.data;

  // Media must come from the user's own folder in our storage bucket.
  const prefix = mediaPrefix(user.id);
  if (![v.coverUrl, ...v.screenshots].every((u) => u.startsWith(prefix))) {
    return { ok: false, error: "Images must be uploaded through the form" };
  }

  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("slug").eq("slug", v.category).maybeSingle();
  if (!category) return { ok: false, error: "Unknown category", fieldErrors: { category: ["Unknown category"] } };

  const id = crypto.randomUUID();
  let gameUrl: string;
  let threejsDetected: boolean | null = null;
  let revision: string | null = null;

  if (v.source === "zip") {
    const result = await extractHostedBuild(v.zipPath!, user.id, id);
    if (!result.ok) return { ok: false, error: result.error, fieldErrors: { zipPath: [result.error] } };
    gameUrl = `/play/${id}/${result.entry}`;
    threejsDetected = result.threejs;
    revision = result.revision;
  } else {
    gameUrl = v.gameUrl!;
    const detection = await detectThreeJs(gameUrl);
    threejsDetected = detection.isThreeJs;
    revision = detection.revision;
  }

  const slug = await uniqueSlug(v.title);
  const { error } = await supabase.from("games").insert({
    id,
    slug,
    title: v.title,
    short_description: v.shortDescription,
    long_description: v.longDescription,
    category_slug: v.category,
    tags: v.tags,
    cover_url: v.coverUrl,
    screenshots: v.screenshots,
    game_url: gameUrl,
    is_hosted: v.source === "zip",
    controls: v.controls,
    developer_name: v.developerName,
    developer_url: v.developerUrl ?? null,
    source_url: v.sourceUrl ?? null,
    submitted_by: user.id,
    status: "pending",
    threejs_detected: threejsDetected,
    threejs_revision: revision,
  });
  if (error) {
    console.error("submitGame", error);
    return { ok: false, error: "Could not save your submission. Please try again." };
  }

  revalidatePath(`/u/${profile.username}`);
  revalidatePath("/admin");
  return { ok: true, data: { slug } };
}

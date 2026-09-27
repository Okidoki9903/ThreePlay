"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function updateProfile(input: {
  username: string;
  displayName?: string;
  bio?: string;
  website?: string;
}): Promise<ActionResult<{ username: string }>> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Not signed in" };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) (fieldErrors[String(i.path[0])] ??= []).push(i.message);
    return { ok: false, error: "Please fix the highlighted fields", fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ username: v.username, display_name: v.displayName || null, bio: v.bio || null, website: v.website ?? null })
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That username is taken", fieldErrors: { username: ["That username is taken"] } };
    return { ok: false, error: "Could not update profile" };
  }
  revalidatePath(`/u/${v.username}`);
  return { ok: true, data: { username: v.username }, message: "Profile saved" };
}

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/** Current auth user + profile, memoised per request. */
export const getSession = cache(async () => {
  if (!isSupabaseConfigured) return { user: null, profile: null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile };
});

export async function requireUser(next = "/") {
  const session = await getSession();
  if (!session.user || !session.profile) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { user: session.user, profile: session.profile };
}

export async function requireAdmin() {
  const session = await requireUser("/admin");
  if (session.profile.role !== "admin") redirect("/");
  return session;
}

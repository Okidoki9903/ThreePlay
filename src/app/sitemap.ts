import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env, isSupabaseConfigured } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const staticRoutes: MetadataRoute.Sitemap = ["", "/games", "/leaderboard", "/submit"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "daily",
    priority: p === "" ? 1 : 0.7,
  }));
  if (!isSupabaseConfigured) return staticRoutes;

  // Cookie-less anon client: the sitemap is public and cacheable.
  const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false } });
  const [{ data: games }, { data: categories }] = await Promise.all([
    supabase.from("games").select("slug, updated_at").eq("status", "approved").limit(5000),
    supabase.from("categories").select("slug"),
  ]);

  return [
    ...staticRoutes,
    ...(categories ?? []).map((c) => ({ url: `${base}/categories/${c.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...(games ?? []).map((g) => ({ url: `${base}/games/${g.slug}`, lastModified: g.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}

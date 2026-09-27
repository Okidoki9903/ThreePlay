import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mimeFor } from "@/lib/hosted-build";

/**
 * Serves files of hosted (zip-uploaded) builds from the private `game-builds` bucket.
 *
 * Security: user-supplied HTML/JS is served from our origin, so every response carries
 * `Content-Security-Policy: sandbox …` — the browser treats the document as an opaque
 * origin even when opened directly, so it can never read ThreePlay cookies or storage.
 * For extra isolation, serve this route from a separate domain in production (see README).
 */
const SANDBOX_CSP =
  "sandbox allow-scripts allow-pointer-lock allow-popups allow-forms allow-modals allow-downloads allow-orientation-lock";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Approval status changes rarely; cache the lookup briefly per instance.
const statusCache = new Map<string, { ok: boolean; at: number }>();

async function isServable(id: string) {
  const hit = statusCache.get(id);
  if (hit && Date.now() - hit.at < 60_000) return hit.ok;
  const { data } = await createAdminClient().from("games").select("status, is_hosted").eq("id", id).maybeSingle();
  const ok = Boolean(data?.is_hosted && data.status !== "rejected");
  statusCache.set(id, { ok, at: Date.now() });
  return ok;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  const { id, path } = await params;
  const rel = path.map(decodeURIComponent).join("/");
  if (!UUID_RE.test(id) || !rel || rel.split("/").some((seg) => seg === ".." || seg === "." || seg === "")) {
    return new Response("Not found", { status: 404 });
  }
  if (!(await isServable(id))) return new Response("Not found", { status: 404 });

  const { data, error } = await createAdminClient().storage.from("game-builds").download(`${id}/${rel}`);
  if (error || !data) return new Response("Not found", { status: 404 });

  return new Response(data.stream(), {
    headers: {
      "Content-Type": mimeFor(rel),
      "Content-Security-Policy": SANDBOX_CSP,
      "X-Content-Type-Options": "nosniff",
      // Opaque-origin documents need CORS for module scripts, fetch() and texture loads.
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

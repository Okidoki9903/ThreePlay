import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Redirects to a random approved game. `?exclude=<id>` avoids repeating the current one. */
export async function GET(request: NextRequest) {
  const exclude = request.nextUrl.searchParams.get("exclude");
  const supabase = await createClient();
  const { data } = await supabase.rpc(
    "random_game_slug",
    exclude && /^[0-9a-f-]{36}$/i.test(exclude) ? { p_exclude: exclude } : {},
  );
  const target = data ? `/games/${data}` : "/games";
  return NextResponse.redirect(new URL(target, request.url), { headers: { "Cache-Control": "no-store" } });
}

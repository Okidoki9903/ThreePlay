import { NextResponse, type NextRequest } from "next/server";
import { listGames } from "@/lib/queries";
import { parseSort } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.min(Math.max(1, Number(sp.get("page")) || 1), 500);
  const { games, hasMore, total } = await listGames({
    q: sp.get("q") ?? undefined,
    tag: sp.get("tag") ?? undefined,
    category: sp.get("category") ?? undefined,
    sort: parseSort(sp.get("sort")),
    page,
  });
  return NextResponse.json({ games, hasMore, total, page });
}

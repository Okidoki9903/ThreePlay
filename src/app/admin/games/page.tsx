import Link from "next/link";
import { Star, StarOff, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/admin/action-button";
import { GameCover } from "@/components/game/game-cover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { deleteGame, setFeatured } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCount, formatRating } from "@/lib/utils";

const STATUS = { approved: "success", pending: "warning", rejected: "destructive" } as const;

export default async function AdminGamesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const db = createAdminClient();
  let query = db
    .from("games")
    .select("id, slug, title, cover_url, status, is_featured, play_count, rating_avg, rating_count, developer_name")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("title", `%${q.replace(/[%_,()]/g, "")}%`);
  const { data: games } = await query;

  return (
    <div className="space-y-4">
      <form className="max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Filter by title…" aria-label="Filter games" />
      </form>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Game</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Plays</th>
              <th className="p-3 text-right">Rating</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(games ?? []).map((g) => (
              <tr key={g.id} className="hover:bg-accent/30">
                <td className="p-3">
                  <Link href={`/games/${g.slug}`} className="flex items-center gap-3 hover:text-primary">
                    <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
                      <GameCover src={g.cover_url} alt="" fill sizes="64px" />
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 font-medium">
                        {g.title} {g.is_featured && <Star className="size-3.5 fill-star text-star" />}
                      </span>
                      <span className="text-xs text-muted-foreground">{g.developer_name}</span>
                    </span>
                  </Link>
                </td>
                <td className="p-3">
                  <Badge variant={STATUS[g.status]} className="capitalize">
                    {g.status}
                  </Badge>
                </td>
                <td className="p-3 text-right tabular-nums">{formatCount(g.play_count)}</td>
                <td className="p-3 text-right tabular-nums">{g.rating_count ? `${formatRating(g.rating_avg)} (${g.rating_count})` : "–"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    {g.status === "approved" && (
                      <ActionButton variant="secondary" action={setFeatured.bind(null, g.id, !g.is_featured)}>
                        {g.is_featured ? <StarOff /> : <Star />} {g.is_featured ? "Unfeature" : "Feature"}
                      </ActionButton>
                    )}
                    <ActionButton variant="ghost" className="text-destructive" action={deleteGame.bind(null, g.id)} confirm={`Delete “${g.title}” permanently? This removes its reviews too.`} aria-label={`Delete ${g.title}`}>
                      <Trash2 />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

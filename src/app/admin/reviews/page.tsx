import Link from "next/link";
import { Eye, EyeOff, MessageSquare, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/admin/action-button";
import { Stars } from "@/components/game/stars";
import { EmptyState } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { adminDeleteReview, setReviewHidden } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/utils";

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const db = createAdminClient();
  let query = db
    .from("reviews")
    .select("*, game:games(slug, title), author:profiles!reviews_user_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter === "hidden") query = query.eq("is_hidden", true);
  if (filter === "text") query = query.neq("body", "");
  const { data: reviews } = await query;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        {[
          [undefined, "All"],
          ["text", "With text"],
          ["hidden", "Hidden"],
        ].map(([value, label]) => (
          <Link key={label} href={value ? `/admin/reviews?filter=${value}` : "/admin/reviews"}>
            <Badge variant={filter === value ? "default" : "outline"} className="px-3 py-1 text-sm">
              {label}
            </Badge>
          </Link>
        ))}
      </div>
      {!reviews?.length ? (
        <EmptyState title="No reviews" icon={<MessageSquare />} />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/u/${r.author?.username}`} className="font-medium hover:text-primary">
                    @{r.author?.username ?? "deleted"}
                  </Link>
                  <span className="text-muted-foreground">on</span>
                  <Link href={`/games/${r.game?.slug}`} className="font-medium hover:text-primary">
                    {r.game?.title}
                  </Link>
                  <Stars value={r.rating} size={12} />
                  <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                  {r.is_hidden && <Badge variant="destructive">Hidden</Badge>}
                </div>
                {r.body && <p className="whitespace-pre-line break-words text-sm text-muted-foreground">{r.body}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <ActionButton variant="secondary" action={setReviewHidden.bind(null, r.id, !r.is_hidden)}>
                  {r.is_hidden ? <Eye /> : <EyeOff />} {r.is_hidden ? "Unhide" : "Hide"}
                </ActionButton>
                <ActionButton variant="ghost" className="text-destructive" action={adminDeleteReview.bind(null, r.id)} confirm="Delete this review permanently?" aria-label="Delete review">
                  <Trash2 />
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

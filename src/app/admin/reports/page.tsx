import Link from "next/link";
import { Check, Flag, X } from "lucide-react";
import { ActionButton } from "@/components/admin/action-button";
import { EmptyState } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { resolveReport } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { REPORT_REASONS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "open" } = await searchParams;
  const db = createAdminClient();
  const { data: reports } = await db
    .from("reports")
    .select("*, game:games(slug, title), review:reviews(body, rating), reporter:profiles!reports_reporter_id_fkey(username)")
    .in("status", status === "closed" ? ["resolved", "dismissed"] : ["open"])
    .order("created_at", { ascending: false })
    .limit(100);

  const label = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        {[
          ["open", "Open"],
          ["closed", "Resolved"],
        ].map(([value, text]) => (
          <Link key={value} href={`/admin/reports?status=${value}`}>
            <Badge variant={status === value ? "default" : "outline"} className="px-3 py-1 text-sm">
              {text}
            </Badge>
          </Link>
        ))}
      </div>
      {!reports?.length ? (
        <EmptyState title="No reports" icon={<Flag />}>
          All clear.
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {reports.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="destructive">{label(r.reason)}</Badge>
                  <Badge variant="outline">{r.review_id ? "Review" : "Game"}</Badge>
                  <Link href={`/games/${r.game?.slug}`} className="font-medium hover:text-primary">
                    {r.game?.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    by @{r.reporter?.username ?? "unknown"} · {timeAgo(r.created_at)}
                  </span>
                </div>
                {r.review && <blockquote className="border-l-2 pl-3 text-sm text-muted-foreground">“{r.review.body || `${r.review.rating}★ (no text)`}”</blockquote>}
                {r.details && <p className="text-sm">{r.details}</p>}
              </div>
              {r.status === "open" && (
                <div className="flex shrink-0 gap-2">
                  <ActionButton action={resolveReport.bind(null, r.id, "resolved")}>
                    <Check /> Resolve
                  </ActionButton>
                  <ActionButton variant="ghost" action={resolveReport.bind(null, r.id, "dismissed")}>
                    <X /> Dismiss
                  </ActionButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

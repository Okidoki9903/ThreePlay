import Link from "next/link";
import { Check, CheckCircle2, ExternalLink, Inbox, ShieldAlert, ShieldCheck } from "lucide-react";
import { ActionButton } from "@/components/admin/action-button";
import { RejectDialog } from "@/components/admin/reject-dialog";
import { GameCover } from "@/components/game/game-cover";
import { EmptyState } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveGame } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/utils";

export default async function AdminQueuePage() {
  const db = createAdminClient();
  const { data: games } = await db
    .from("games")
    .select("*, submitter:profiles!games_submitted_by_fkey(username)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!games?.length) return <EmptyState title="The queue is empty" icon={<Inbox />}>Nice work — nothing waiting for review.</EmptyState>;

  return (
    <ul className="space-y-4">
      {games.map((g) => (
        <li key={g.id} className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-[240px_1fr_auto]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
            <GameCover src={g.cover_url} alt="" fill sizes="240px" />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{g.title}</h2>
              <Badge variant="outline">{g.category_slug}</Badge>
              {g.threejs_detected === true ? (
                <Badge variant="success">
                  <ShieldCheck /> Three.js{g.threejs_revision ? ` r${g.threejs_revision}` : ""}
                </Badge>
              ) : (
                <Badge variant="warning">
                  <ShieldAlert /> {g.threejs_detected === false ? "Three.js not detected" : "Detection unavailable"}
                </Badge>
              )}
              {g.is_hosted && <Badge variant="secondary">Hosted zip</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{g.short_description}</p>
            <p className="text-xs text-muted-foreground">
              by {g.developer_name}
              {g.submitter && (
                <>
                  {" · submitted by "}
                  <Link href={`/u/${g.submitter.username}`} className="hover:text-foreground">
                    @{g.submitter.username}
                  </Link>
                </>
              )}{" "}
              · {timeAgo(g.created_at)}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">{g.game_url}</p>
            {g.tags.length > 0 && <p className="text-xs text-muted-foreground">{g.tags.map((t) => `#${t}`).join(" ")}</p>}
          </div>
          <div className="flex flex-wrap items-start gap-2 md:flex-col md:items-stretch">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/games/${g.slug}`} target="_blank">
                <ExternalLink /> Preview
              </Link>
            </Button>
            <ActionButton action={approveGame.bind(null, g.id)}>
              <Check /> Approve
            </ActionButton>
            <RejectDialog gameId={g.id} title={g.title} />
          </div>
        </li>
      ))}
      <li className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4" /> {games.length} pending
      </li>
    </ul>
  );
}

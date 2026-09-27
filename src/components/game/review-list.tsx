import Link from "next/link";
import { Flag, MessageSquare } from "lucide-react";
import { Stars } from "@/components/game/stars";
import { ReportDialog } from "@/components/game/report-dialog";
import { UserAvatar } from "@/components/layout/user-menu";
import { timeAgo } from "@/lib/utils";
import type { ReviewWithAuthor } from "@/lib/types";

export function ReviewList({ reviews, gameId, signedIn, viewerId }: { reviews: ReviewWithAuthor[]; gameId: string; signedIn: boolean; viewerId?: string }) {
  const withText = reviews.filter((r) => r.body.trim().length > 0);
  if (withText.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <MessageSquare className="size-6" />
        No written reviews yet.
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {withText.map((r) => (
        <li key={r.id} className="flex gap-3 py-5">
          {r.author && (
            <Link href={`/u/${r.author.username}`} className="shrink-0">
              <UserAvatar profile={r.author} />
            </Link>
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {r.author ? (
                <Link href={`/u/${r.author.username}`} className="font-medium hover:text-primary">
                  {r.author.display_name ?? r.author.username}
                </Link>
              ) : (
                <span className="font-medium">Deleted user</span>
              )}
              <Stars value={r.rating} size={12} />
              <span className="text-xs text-muted-foreground">
                {timeAgo(r.created_at)}
                {r.updated_at !== r.created_at && new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() > 60_000 && " · edited"}
              </span>
              {r.user_id !== viewerId && (
                <span className="ml-auto">
                  <ReportDialog
                    gameId={gameId}
                    reviewId={r.id}
                    signedIn={signedIn}
                    trigger={
                      <button className="rounded p-1 text-muted-foreground/60 transition hover:text-foreground" aria-label="Report review">
                        <Flag className="size-3.5" />
                      </button>
                    }
                  />
                </span>
              )}
            </div>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{r.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

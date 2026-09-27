"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarInput } from "@/components/game/star-input";
import { deleteMyReview, saveReview } from "@/lib/actions/reviews";
import type { Review } from "@/lib/types";

export function ReviewForm({ gameId, existing, signedIn, loginHref }: { gameId: string; existing: Review | null; signedIn: boolean; loginHref: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [editing, setEditing] = useState(!existing);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Played it? Sign in to leave a rating and review.</p>
        <Button asChild size="sm">
          <Link href={loginHref}>Sign in to rate</Link>
        </Button>
      </div>
    );
  }

  if (existing && !editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-primary/5 p-4 text-sm">
        <span>
          You rated this <strong>{existing.rating}★</strong>. Thanks!
        </span>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit review
        </Button>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return void toast.error("Pick a star rating first");
    startTransition(async () => {
      const res = await saveReview({ gameId, rating, body });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteMyReview(gameId);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      setRating(0);
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-5">
      <p className="text-sm font-medium">{existing ? "Update your review" : "Rate this game"}</p>
      <StarInput value={rating} onChange={setRating} />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think? (optional)"
        maxLength={2000}
        aria-label="Review text"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{body.length}/2000</span>
        <div className="flex gap-2">
          {existing && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={pending} className="text-destructive">
                Delete
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          )}
          <Button type="submit" size="sm" disabled={pending || !rating}>
            {pending ? "Saving…" : existing ? "Update" : "Post review"}
          </Button>
        </div>
      </div>
    </form>
  );
}

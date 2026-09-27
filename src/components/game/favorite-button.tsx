"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/lib/actions/favorites";
import { useHotkey } from "@/hooks/use-hotkey";
import { cn, formatCount } from "@/lib/utils";

export function FavoriteButton({
  gameId,
  initial,
  count,
  signedIn,
}: {
  gameId: string;
  initial: boolean;
  count: number;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, setState] = useOptimistic({ fav: initial, count }, (_, next: { fav: boolean; count: number }) => next);

  function toggle() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    const next = !state.fav;
    startTransition(async () => {
      setState({ fav: next, count: state.count + (next ? 1 : -1) });
      const res = await toggleFavorite(gameId, next);
      if (!res.ok) toast.error(res.error);
      else toast.success(next ? "Added to favorites" : "Removed from favorites");
      router.refresh();
    });
  }

  useHotkey("l", toggle);

  return (
    <Button variant="secondary" onClick={toggle} aria-pressed={state.fav} title="Favorite (L)">
      <motion.span key={String(state.fav)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <Heart className={cn("size-4", state.fav && "fill-rose-500 text-rose-500")} />
      </motion.span>
      {state.fav ? "Favorited" : "Favorite"}
      {state.count > 0 && <span className="text-muted-foreground">{formatCount(state.count)}</span>}
    </Button>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Maximize, Minimize, Play, RotateCcw } from "lucide-react";
import { GameCover } from "@/components/game/game-cover";
import { Button } from "@/components/ui/button";
import { recordPlay } from "@/lib/actions/games";
import { useHotkey } from "@/hooks/use-hotkey";
import { IFRAME_ALLOW, IFRAME_SANDBOX_BASE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  game: { id: string; title: string; cover_url: string; game_url: string; is_hosted: boolean };
  countPlays: boolean;
};

export function GamePlayer({ game, countPlays }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // Hosted builds live on our origin, so they must stay in an opaque-origin sandbox.
  const hosted = game.is_hosted || game.game_url.startsWith("/");
  const sandbox = hosted ? IFRAME_SANDBOX_BASE : `${IFRAME_SANDBOX_BASE} allow-same-origin`;

  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    if (countPlays) recordPlay(game.id).catch(() => {});
  }, [started, countPlays, game.id]);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapper.current;
    if (!el) return;
    if (!started) start();
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen?.().catch(() => {});
  }, [started, start]);

  const reload = useCallback(() => {
    if (!started) return start();
    setLoaded(false);
    setReloadKey((k) => k + 1);
  }, [started, start]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapper.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useHotkey(["Enter", "p"], start, !started);
  useHotkey("f", toggleFullscreen);
  useHotkey("r", reload);

  return (
    <div className="space-y-2">
      <div
        ref={wrapper}
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-2xl border bg-black shadow-2xl shadow-primary/10",
          fullscreen && "rounded-none border-0",
        )}
      >
        <AnimatePresence>
          {!started && (
            <motion.button
              key="poster"
              type="button"
              onClick={start}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="group absolute inset-0 z-10 cursor-pointer"
              aria-label={`Play ${game.title}`}
            >
              <GameCover src={game.cover_url} alt="" fill priority sizes="(min-width: 1280px) 900px, 100vw" className="scale-105 blur-[2px] brightness-50 transition duration-500 group-hover:blur-0 group-hover:brightness-75" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="flex flex-col items-center gap-4">
                  <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_60px_-5px_var(--primary)] transition-transform duration-300 group-hover:scale-110 sm:size-24">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 [animation-duration:2.5s]" />
                    <Play className="size-8 translate-x-0.5 fill-current sm:size-10" />
                  </span>
                  <span className="rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium backdrop-blur">
                    Click to play <kbd className="ml-1 rounded border border-white/20 px-1.5 font-mono text-xs">Enter</kbd>
                  </span>
                </span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {started && (
          <>
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="size-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-label="Loading game" />
              </div>
            )}
            <iframe
              key={reloadKey}
              src={game.game_url}
              title={game.title}
              sandbox={sandbox}
              allow={IFRAME_ALLOW}
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setLoaded(true)}
              className={cn("absolute inset-0 size-full border-0 transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="hidden sm:block">
          Press <kbd className="rounded border px-1 font-mono">?</kbd> for keyboard shortcuts. Click outside the game to use them.
        </p>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={reload} title="Reload game (R)">
            <RotateCcw /> Reload
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} title="Fullscreen (F)">
            {fullscreen ? <Minimize /> : <Maximize />} Fullscreen
          </Button>
          {!hosted && (
            <Button variant="ghost" size="sm" asChild title="Open in a new tab">
              <a href={game.game_url} target="_blank" rel="noopener noreferrer" onClick={() => countPlays && !started && recordPlay(game.id)}>
                <ExternalLink /> New tab
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

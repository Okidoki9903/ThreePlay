"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Dices, Play, Sparkles, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCover } from "@/components/game/game-cover";
import { ThreeBackdrop } from "@/components/home/three-backdrop";
import { formatCount, formatRating } from "@/lib/utils";
import type { Game } from "@/lib/types";

export function Hero({ featured, totalGames }: { featured: Game | null; totalGames: number }) {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <section className="relative isolate overflow-hidden border-b">
      <div className="bg-grid absolute inset-0 -z-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute -left-40 -top-40 -z-20 size-[36rem] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute -bottom-40 right-0 -z-20 size-[30rem] rounded-full bg-glow/15 blur-[120px]" />
      <ThreeBackdrop className="absolute inset-0 -z-10 opacity-70" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div className="space-y-6">
          <motion.div {...rise(0)}>
            <Badge variant="outline" className="glass gap-1.5 px-3 py-1 text-foreground">
              <Sparkles className="text-glow" /> {totalGames} free games · WebGL &amp; WebGPU
            </Badge>
          </motion.div>
          <motion.h1 {...rise(0.08)} className="text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            The home of <span className="text-gradient">Three.js</span> games.
          </motion.h1>
          <motion.p {...rise(0.16)} className="max-w-xl text-lg text-muted-foreground text-pretty">
            Discover, play and rate free 3D games that run instantly in your browser. No installs, no launchers — just click and play.
          </motion.p>
          <motion.div {...rise(0.24)} className="flex flex-wrap gap-3">
            <Button asChild variant="glow" size="lg">
              <Link href="/games">
                <Play className="fill-current" /> Start playing
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="glass">
              <Link href="/random" prefetch={false}>
                <Dices /> Surprise me
              </Link>
            </Button>
          </motion.div>
        </div>

        {featured && (
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96, rotateX: 8 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: 1000 }}
          >
            <Link
              href={`/games/${featured.slug}`}
              className="group relative block overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10 ring-1 ring-white/5 transition hover:border-primary/40"
            >
              <div className="relative aspect-[16/10]">
                <GameCover src={featured.cover_url} alt={featured.title} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <Badge className="absolute left-4 top-4 bg-background/80 text-foreground backdrop-blur">
                  <Star className="fill-star text-star" /> Featured
                </Badge>
                <span className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg shadow-primary/40 transition group-hover:opacity-100">
                  <Play className="size-5 translate-x-0.5 fill-current" />
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
                <h2 className="text-2xl font-semibold tracking-tight">{featured.title}</h2>
                <p className="line-clamp-2 text-sm text-muted-foreground">{featured.short_description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {featured.rating_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-star text-star" /> {formatRating(featured.rating_avg)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {formatCount(featured.play_count)} plays
                  </span>
                  <span>by {featured.developer_name}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

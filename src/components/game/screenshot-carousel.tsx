"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GameCover } from "@/components/game/game-cover";
import { cn } from "@/lib/utils";

export function ScreenshotCarousel({ images, title }: { images: string[]; title: string }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  if (images.length === 0) return null;
  const go = (delta: number) => setState(([i]) => [(i + delta + images.length) % images.length, delta]);
  const current = images[index]!;

  return (
    <div className="space-y-3" aria-roledescription="carousel" aria-label={`${title} screenshots`}>
      <div
        className="group relative aspect-video overflow-hidden rounded-xl border bg-muted"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        tabIndex={0}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={current}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            drag={images.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
            className="absolute inset-0"
          >
            <GameCover src={current} alt={`${title} screenshot ${index + 1} of ${images.length}`} fill sizes="(min-width: 1024px) 60vw, 100vw" draggable={false} />
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100" aria-label="Previous screenshot">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100" aria-label="Next screenshot">
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setState([i, i > index ? 1 : -1])}
              className={cn("relative aspect-video w-24 shrink-0 overflow-hidden rounded-md border-2 transition", i === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100")}
              aria-label={`Show screenshot ${i + 1}`}
              aria-current={i === index}
            >
              <GameCover src={src} alt="" fill sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

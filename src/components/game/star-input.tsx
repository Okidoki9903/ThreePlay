"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = ["", "Not for me", "Meh", "Good", "Great", "Masterpiece"];

export function StarInput({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(5, (value || 0) + 1));
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(1, (value || 2) - 1));
            }}
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            className="p-0.5 transition-transform hover:scale-110 focus-visible:scale-110"
          >
            <Star
              style={{ width: size, height: size }}
              className={cn("transition-colors", n <= shown ? "fill-star text-star" : "text-muted-foreground/40")}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {LABELS[shown]}
      </span>
    </div>
  );
}

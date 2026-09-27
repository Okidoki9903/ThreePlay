import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  // A stylised isometric cube — the "three" in ThreePlay — with a play triangle cut into the front face.
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="tp-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.72 0.19 285)" />
          <stop offset="1" stopColor="oklch(0.82 0.14 200)" />
        </linearGradient>
      </defs>
      <path d="M16 2 29 9.5v13L16 30 3 22.5v-13Z" fill="url(#tp-a)" opacity=".18" />
      <path d="M16 2 29 9.5v13L16 30 3 22.5v-13Z M16 2v28 M3 9.5l13 7.5 13-7.5" fill="none" stroke="url(#tp-a)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m13 12.5 7 4-7 4Z" fill="url(#tp-a)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2 font-semibold tracking-tight", className)} aria-label="ThreePlay home">
      <LogoMark className="transition-transform duration-500 group-hover:rotate-[60deg]" />
      <span className="text-lg">
        Three<span className="text-gradient">Play</span>
      </span>
    </Link>
  );
}

import type { Enums } from "@/lib/database.types";

export const SITE = {
  name: "ThreePlay",
  tagline: "Free Three.js games. Instantly playable.",
  description:
    "Discover, play and rate the best free Three.js (WebGL / WebGPU) browser games. No installs, no downloads — just click and play.",
  github: "https://github.com/okidoki9903/threeplay",
};

export const PAGE_SIZE = 12;

export const SORTS = [
  { value: "popular", label: "Most played" },
  { value: "new", label: "Newest" },
  { value: "top", label: "Top rated" },
  { value: "az", label: "A–Z" },
] as const;
export type SortValue = (typeof SORTS)[number]["value"];

export function parseSort(sort: string | null | undefined): SortValue {
  return SORTS.some((s) => s.value === sort) ? (sort as SortValue) : "popular";
}

export const REPORT_REASONS: { value: Enums<"report_reason">; label: string }[] = [
  { value: "broken", label: "Game doesn't load / is broken" },
  { value: "not_threejs", label: "Not a Three.js game" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "malware", label: "Malware, phishing or crypto-mining" },
  { value: "copyright", label: "Copyright infringement" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Something else" },
];

/** Sandbox for embedded games. Hosted builds never get allow-same-origin (they live on our origin). */
export const IFRAME_SANDBOX_BASE =
  "allow-scripts allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-modals allow-orientation-lock";
export const IFRAME_ALLOW = "fullscreen; gamepad; autoplay; xr-spatial-tracking; accelerometer; gyroscope; clipboard-write";

export const MAX_ZIP_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

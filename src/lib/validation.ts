import { z } from "zod";
import { normalizeTag } from "@/lib/utils";

const httpsUrl = z
  .string()
  .trim()
  .url({ error: "Must be a valid URL" })
  .refine((u) => u.startsWith("https://"), { error: "Must start with https://" });

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(httpsUrl.optional());

export const tagsSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(",")))
  .transform((tags) => [...new Set(tags.map(normalizeTag).filter((t) => t.length >= 2))])
  .pipe(z.array(z.string()).max(10, { error: "At most 10 tags" }));

export const submitGameSchema = z
  .object({
    title: z.string().trim().min(2, { error: "Title is too short" }).max(80),
    shortDescription: z.string().trim().min(10, { error: "At least 10 characters" }).max(160),
    longDescription: z.string().trim().max(10000).default(""),
    category: z.string().trim().min(1, { error: "Pick a category" }),
    tags: tagsSchema,
    source: z.enum(["url", "zip"]),
    gameUrl: optionalUrl,
    zipPath: z.string().trim().optional(),
    coverUrl: httpsUrl,
    screenshots: z.array(httpsUrl).max(8, { error: "At most 8 screenshots" }).default([]),
    controls: z.string().trim().max(2000).default(""),
    developerName: z.string().trim().min(1, { error: "Required" }).max(60),
    developerUrl: optionalUrl,
    sourceUrl: optionalUrl,
    agree: z.literal(true, { error: "You must confirm you have the right to publish this game" }),
  })
  .superRefine((v, ctx) => {
    if (v.source === "url" && !v.gameUrl) ctx.addIssue({ code: "custom", path: ["gameUrl"], message: "Game URL is required" });
    if (v.source === "zip" && !v.zipPath) ctx.addIssue({ code: "custom", path: ["zipPath"], message: "Upload a .zip build" });
  });
export type SubmitGameInput = z.input<typeof submitGameSchema>;

export const reviewSchema = z.object({
  gameId: z.uuid(),
  rating: z.coerce.number().int().min(1, { error: "Pick a rating" }).max(5),
  body: z.string().trim().max(2000, { error: "Keep it under 2000 characters" }).default(""),
});

export const reportSchema = z.object({
  gameId: z.uuid(),
  reviewId: z.uuid().optional(),
  reason: z.enum(["broken", "not_threejs", "inappropriate", "malware", "copyright", "spam", "other"]),
  details: z.string().trim().max(1000).default(""),
});

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, { error: "3–24 chars: lowercase letters, numbers, underscores" }),
  displayName: z.string().trim().max(60).default(""),
  bio: z.string().trim().max(280).default(""),
  website: optionalUrl,
});

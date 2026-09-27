"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileArchive, ImagePlus, Link2, LoaderCircle, PartyPopper, WandSparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { detectGameUrl, submitGame } from "@/lib/actions/games";
import { MAX_IMAGE_BYTES, MAX_ZIP_BYTES } from "@/lib/constants";
import type { DetectionResult } from "@/lib/detect-threejs";
import type { Category } from "@/lib/types";
import { cn, normalizeTag } from "@/lib/utils";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

type FieldErrors = Record<string, string[] | undefined>;

function Field({ label, htmlFor, hint, error, children, required }: { label: string; htmlFor?: string; hint?: React.ReactNode; error?: string[]; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error?.length ? (
        <p className="text-xs text-destructive" role="alert">
          {error[0]}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function SubmitForm({ userId, categories, defaultDeveloper }: { userId: string; categories: Category[]; defaultDeveloper: string }) {
  const supabase = useRef(createClient()).current;
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [shortDescription, setShort] = useState("");
  const [longDescription, setLong] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [source, setSource] = useState<"url" | "zip">("url");
  const [gameUrl, setGameUrl] = useState("");
  const [zipPath, setZipPath] = useState<string | null>(null);
  const [zipName, setZipName] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [controls, setControls] = useState("");
  const [developerName, setDeveloperName] = useState(defaultDeveloper);
  const [developerUrl, setDeveloperUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [agree, setAgree] = useState(false);

  const [uploading, setUploading] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);

  async function uploadImage(file: File): Promise<string | null> {
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error(`${file.name}: use PNG, JPEG, WebP, GIF or AVIF`);
      return null;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`${file.name}: images must be under 5 MB`);
      return null;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("game-media").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    return supabase.storage.from("game-media").getPublicUrl(path).data.publicUrl;
  }

  async function onCover(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading("cover");
    const url = await uploadImage(file);
    if (url) setCoverUrl(url);
    setUploading(null);
  }

  async function onScreenshots(files: FileList | null) {
    if (!files?.length) return;
    const room = 8 - screenshots.length;
    if (room <= 0) return void toast.error("You can add up to 8 screenshots");
    setUploading("screenshots");
    const urls = await Promise.all([...files].slice(0, room).map(uploadImage));
    setScreenshots((s) => [...s, ...urls.filter((u): u is string => Boolean(u))]);
    setUploading(null);
  }

  async function onZip(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) return void toast.error("Please upload a .zip file");
    if (file.size > MAX_ZIP_BYTES) return void toast.error("Zip must be under 50 MB");
    setUploading("zip");
    const path = `${userId}/${crypto.randomUUID()}.zip`;
    const { error } = await supabase.storage.from("game-uploads").upload(path, file, { contentType: "application/zip" });
    setUploading(null);
    if (error) return void toast.error(`Upload failed: ${error.message}`);
    setZipPath(path);
    setZipName(file.name);
  }

  function addTag(raw: string) {
    const parts = raw.split(",").map(normalizeTag).filter((t) => t.length >= 2);
    setTags((prev) => [...new Set([...prev, ...parts])].slice(0, 10));
    setTagDraft("");
  }

  async function detect() {
    if (!gameUrl) return;
    setDetecting(true);
    setDetection(null);
    const res = await detectGameUrl(gameUrl);
    setDetecting(false);
    if (!res.ok) return void toast.error(res.error);
    setDetection(res.data ?? null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const pendingTag = tagDraft.trim() ? [...tags, normalizeTag(tagDraft)] : tags;
    startTransition(async () => {
      const res = await submitGame({
        title,
        shortDescription,
        longDescription,
        category,
        tags: pendingTag,
        source,
        gameUrl: source === "url" ? gameUrl : "",
        zipPath: source === "zip" ? (zipPath ?? undefined) : undefined,
        coverUrl: coverUrl ?? "",
        screenshots,
        controls,
        developerName,
        developerUrl,
        sourceUrl,
        agree: agree as true,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        document.querySelector("[role=alert]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setDone(res.data!.slug);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 rounded-2xl border bg-card p-8 text-center">
        <PartyPopper className="mx-auto size-10 text-primary" />
        <h2 className="text-2xl font-semibold">Submission received!</h2>
        <p className="text-muted-foreground">A moderator will review it soon. You can preview it and track its status from your profile.</p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href={`/games/${done}`}>Preview game page</Link>
          </Button>
          <Button variant="outline" onClick={() => location.reload()}>
            Submit another
          </Button>
        </div>
      </motion.div>
    );
  }

  const busy = pending || uploading !== null;

  return (
    <form onSubmit={submit} className="space-y-10" noValidate>
      <fieldset className="space-y-5">
        <legend className="mb-4 text-lg font-semibold">The basics</legend>
        <Field label="Title" htmlFor="title" required error={errors.title}>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} aria-invalid={Boolean(errors.title)} placeholder="Neon Drift" />
        </Field>
        <Field label="Short description" htmlFor="short" required error={errors.shortDescription} hint={`${shortDescription.length}/160 — shown on cards and in link previews`}>
          <Input id="short" value={shortDescription} onChange={(e) => setShort(e.target.value)} maxLength={160} aria-invalid={Boolean(errors.shortDescription)} placeholder="A one-line pitch for your game" />
        </Field>
        <Field label="Full description" htmlFor="long" error={errors.longDescription} hint="Plain text. Separate paragraphs with a blank line.">
          <Textarea id="long" rows={6} value={longDescription} onChange={(e) => setLong(e.target.value)} maxLength={10000} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" required error={errors.category}>
            <NativeSelect id="category" value={category} onChange={(e) => setCategory(e.target.value)} aria-invalid={Boolean(errors.category)}>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Tags" htmlFor="tags" error={errors.tags} hint="Up to 10. Press Enter or comma to add.">
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background/60 px-2 py-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                    <X />
                  </button>
                </Badge>
              ))}
              <input
                id="tags"
                value={tagDraft}
                onChange={(e) => (e.target.value.endsWith(",") ? addTag(e.target.value) : setTagDraft(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagDraft);
                  } else if (e.key === "Backspace" && !tagDraft) setTags(tags.slice(0, -1));
                }}
                onBlur={() => tagDraft && addTag(tagDraft)}
                disabled={tags.length >= 10}
                className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder={tags.length ? "" : "low-poly, physics"}
              />
            </div>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-4 text-lg font-semibold">The game</legend>
        <div role="tablist" className="inline-flex rounded-xl bg-muted p-1">
          {(
            [
              ["url", "Link to URL", Link2],
              ["zip", "Upload .zip", FileArchive],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={source === value}
              onClick={() => setSource(value)}
              className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition", source === value ? "bg-background shadow" : "text-muted-foreground hover:text-foreground")}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {source === "url" ? (
            <motion.div key="url" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3">
              <Field label="Game URL" htmlFor="gameUrl" required error={errors.gameUrl} hint="Must be https and allow embedding in an iframe.">
                <div className="flex gap-2">
                  <Input
                    id="gameUrl"
                    type="url"
                    value={gameUrl}
                    onChange={(e) => {
                      setGameUrl(e.target.value);
                      setDetection(null);
                    }}
                    placeholder="https://you.github.io/my-game/"
                    aria-invalid={Boolean(errors.gameUrl)}
                  />
                  <Button type="button" variant="secondary" onClick={detect} disabled={!gameUrl || detecting}>
                    {detecting ? <LoaderCircle className="animate-spin" /> : <WandSparkles />} Detect
                  </Button>
                </div>
              </Field>
              {detection && <DetectionPanel result={detection} />}
            </motion.div>
          ) : (
            <motion.div key="zip" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Field label="Static build (.zip)" required error={errors.zipPath} hint="We look for Three.js automatically once the build is unpacked.">
                <label className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition hover:border-primary/50 hover:bg-primary/5", errors.zipPath && "border-destructive")}>
                  {uploading === "zip" ? <LoaderCircle className="size-6 animate-spin text-primary" /> : <FileArchive className="size-6 text-muted-foreground" />}
                  <span className="text-sm font-medium">{zipName ?? "Choose a .zip file"}</span>
                  <span className="text-xs text-muted-foreground">{zipPath ? "Uploaded ✓ — click to replace" : "Max 50 MB"}</span>
                  <input type="file" accept=".zip,application/zip" className="sr-only" onChange={(e) => onZip(e.target.files)} disabled={uploading !== null} />
                </label>
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field
          label="Controls"
          htmlFor="controls"
          error={errors.controls}
          hint={
            <>
              One per line, like <code className="rounded bg-muted px-1">W A S D — move</code>
            </>
          }
        >
          <Textarea id="controls" rows={4} value={controls} onChange={(e) => setControls(e.target.value)} maxLength={2000} placeholder={"Mouse — look\nW A S D — move\nSpace — jump"} className="font-mono text-xs" />
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-4 text-lg font-semibold">Media</legend>
        <Field label="Cover image" required error={errors.coverUrl} hint="16:10 works best, at least 1200×750. PNG, JPEG, WebP, GIF or AVIF under 5 MB.">
          <label className={cn("group relative flex aspect-[16/10] max-w-md cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition hover:border-primary/50", errors.coverUrl && "border-destructive")}>
            {coverUrl ? (
              <Image src={coverUrl} alt="Cover preview" fill className="object-cover" sizes="448px" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                {uploading === "cover" ? <LoaderCircle className="size-6 animate-spin text-primary" /> : <ImagePlus className="size-6" />}
                Upload cover
              </span>
            )}
            <input type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => onCover(e.target.files)} disabled={uploading !== null} />
          </label>
        </Field>
        <Field label="Screenshots / GIFs" error={errors.screenshots} hint="Up to 8.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {screenshots.map((src) => (
              <div key={src} className="group relative aspect-video overflow-hidden rounded-lg border">
                <Image src={src} alt="" fill className="object-cover" sizes="200px" />
                <button type="button" onClick={() => setScreenshots(screenshots.filter((s) => s !== src))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100" aria-label="Remove screenshot">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {screenshots.length < 8 && (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground transition hover:border-primary/50">
                {uploading === "screenshots" ? <LoaderCircle className="size-5 animate-spin text-primary" /> : <ImagePlus className="size-5" />}
                Add
                <input type="file" multiple accept={IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => onScreenshots(e.target.files)} disabled={uploading !== null} />
              </label>
            )}
          </div>
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-4 text-lg font-semibold">Credits</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Developer / studio" htmlFor="dev" required error={errors.developerName}>
            <Input id="dev" value={developerName} onChange={(e) => setDeveloperName(e.target.value)} maxLength={60} />
          </Field>
          <Field label="Developer website" htmlFor="devUrl" error={errors.developerUrl}>
            <Input id="devUrl" type="url" value={developerUrl} onChange={(e) => setDeveloperUrl(e.target.value)} placeholder="https://" />
          </Field>
        </div>
        <Field label="Source code" htmlFor="srcUrl" error={errors.sourceUrl} hint="Optional — link to a public repo.">
          <Input id="srcUrl" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://github.com/…" />
        </Field>
      </fieldset>

      <div className="space-y-4 border-t pt-6">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
          <span>I made this game or have permission to publish it, and it follows the submission guidelines.</span>
        </label>
        {errors.agree && (
          <p className="text-xs text-destructive" role="alert">
            {errors.agree[0]}
          </p>
        )}
        <Button type="submit" variant="glow" size="lg" disabled={busy}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" /> {source === "zip" ? "Unpacking & checking…" : "Checking & submitting…"}
            </>
          ) : (
            "Submit for review"
          )}
        </Button>
      </div>
    </form>
  );
}

function DetectionPanel({ result }: { result: DetectionResult }) {
  const ok = result.isThreeJs === true;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className={cn("space-y-2 rounded-xl border p-4 text-sm", ok ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5")}>
      <p className="flex items-center gap-2 font-medium">
        {ok ? <CheckCircle2 className="size-4 text-success" /> : <AlertCircle className="size-4 text-warning" />}
        {result.error
          ? `Couldn't check automatically: ${result.error}`
          : ok
            ? `Three.js detected${result.revision ? ` (r${result.revision})` : ""}`
            : "No Three.js fingerprints found — a moderator will check manually"}
      </p>
      {result.signals.length > 0 && <p className="text-xs text-muted-foreground">Signals: {result.signals.join(" · ")}</p>}
      {result.embeddable === false && (
        <p className="flex items-center gap-2 text-xs text-warning">
          <AlertCircle className="size-3.5" /> This site blocks iframes (X-Frame-Options / CSP). Players will need to open it in a new tab — consider uploading a zip instead.
        </p>
      )}
    </motion.div>
  );
}

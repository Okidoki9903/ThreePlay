import "server-only";
import { unzipSync } from "fflate";
import { createAdminClient } from "@/lib/supabase/admin";
import { scanSource } from "@/lib/detect-threejs";

const MAX_FILES = 2000;
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;

export const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json",
  map: "application/json",
  wasm: "application/wasm",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  ktx2: "image/ktx2",
  basis: "application/octet-stream",
  hdr: "application/octet-stream",
  exr: "application/octet-stream",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  bin: "application/octet-stream",
  obj: "text/plain",
  fbx: "application/octet-stream",
  drc: "application/octet-stream",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml",
};

export function mimeFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export type ExtractResult =
  | { ok: true; entry: string; fileCount: number; threejs: boolean; revision: string | null }
  | { ok: false; error: string };

/**
 * Downloads a user's zip from `game-uploads`, validates it and writes every file to
 * `game-builds/<gameId>/`. Returns the path of the entry HTML file.
 */
export async function extractHostedBuild(zipPath: string, userId: string, gameId: string): Promise<ExtractResult> {
  if (!zipPath.startsWith(`${userId}/`) || zipPath.includes("..")) return { ok: false, error: "Invalid upload path" };

  const admin = createAdminClient();
  const { data: blob, error } = await admin.storage.from("game-uploads").download(zipPath);
  if (error || !blob) return { ok: false, error: "Could not read the uploaded zip" };

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(new Uint8Array(await blob.arrayBuffer()), {
      filter: (f) => !f.name.endsWith("/") && !f.name.startsWith("__MACOSX/") && !/(^|\/)\./.test(f.name),
    });
  } catch {
    return { ok: false, error: "The file is not a valid zip archive" };
  }

  const names = Object.keys(files);
  if (names.length === 0) return { ok: false, error: "The zip is empty" };
  if (names.length > MAX_FILES) return { ok: false, error: `Too many files (max ${MAX_FILES})` };
  const total = names.reduce((n, k) => n + files[k]!.byteLength, 0);
  if (total > MAX_TOTAL_BYTES) return { ok: false, error: "Uncompressed build is larger than 150 MB" };
  if (names.some((n) => n.includes("..") || n.startsWith("/") || n.includes("\\"))) {
    return { ok: false, error: "The zip contains unsafe paths" };
  }

  // Shallowest index.html is the entry; strip a single wrapping folder if present.
  const index = names
    .filter((n) => /(^|\/)index\.html?$/i.test(n))
    .sort((a, b) => a.split("/").length - b.split("/").length)[0];
  if (!index) return { ok: false, error: "No index.html found in the zip" };
  const prefix = index.includes("/") ? index.slice(0, index.lastIndexOf("/") + 1) : "";

  const signals = new Set<string>();
  let revision: string | null = null;
  const uploads: { path: string; data: Uint8Array }[] = [];
  for (const name of names) {
    if (prefix && !name.startsWith(prefix)) continue;
    const rel = name.slice(prefix.length);
    const data = files[name]!;
    if (/\.(m?js|html?)$/i.test(rel) && data.byteLength < 8 * 1024 * 1024) {
      revision ??= scanSource(new TextDecoder().decode(data), signals);
    }
    uploads.push({ path: rel, data });
  }

  // Upload with limited concurrency.
  const bucket = admin.storage.from("game-builds");
  const queue = [...uploads];
  const workers = Array.from({ length: 8 }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      const { error: upErr } = await bucket.upload(`${gameId}/${item.path}`, item.data, {
        contentType: mimeFor(item.path),
        upsert: true,
      });
      if (upErr) throw new Error(`${item.path}: ${upErr.message}`);
    }
  });
  try {
    await Promise.all(workers);
  } catch (e) {
    return { ok: false, error: `Upload failed — ${(e as Error).message}` };
  }

  // The raw zip is no longer needed.
  await admin.storage.from("game-uploads").remove([zipPath]);

  return { ok: true, entry: index.slice(prefix.length), fileCount: uploads.length, threejs: signals.size > 0, revision };
}

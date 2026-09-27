import "server-only";

export type DetectionResult = {
  /** true = found Three.js, false = checked and found nothing, null = could not check */
  isThreeJs: boolean | null;
  revision: string | null;
  signals: string[];
  /** false when the page forbids being framed (X-Frame-Options / CSP frame-ancestors). */
  embeddable: boolean | null;
  error?: string;
};

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_SCRIPTS = 8;
const TIMEOUT_MS = 6000;

const PATTERNS: { re: RegExp; label: string }[] = [
  { re: /three(?:\.module|\.core)?(?:\.min)?\.m?js/i, label: "three.js bundle file" },
  { re: /["']three["']\s*:/, label: "import map entry for 'three'" },
  { re: /from\s*["']three(?:\/[^"']*)?["']/, label: "ES module import from 'three'" },
  { re: /(?:unpkg\.com|jsdelivr\.net|cdnjs\.cloudflare\.com)[^"'\s]*three/i, label: "three.js from CDN" },
  { re: /THREE\.(?:WebGLRenderer|WebGPURenderer|Scene|PerspectiveCamera|Mesh)\b/, label: "THREE.* API usage" },
  { re: /\bWebGLRenderer\b[\s\S]{0,4000}\bPerspectiveCamera\b/, label: "Three.js renderer + camera symbols" },
  { re: /__THREE__/, label: "__THREE__ global" },
];

// Three.js source defines `const REVISION = '170'` and registers `__THREE__`.
const REVISION_RE = /REVISION\s*=\s*["'](\d{2,3}(?:dev)?)["']/;
const THREE_VERSION_URL_RE = /three(?:@|\/)0?\.?(\d{2,3})(?:\.\d+)?/i;

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h === "0.0.0.0" || h === "[::1]") return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

async function fetchText(url: string): Promise<{ text: string; headers: Headers } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "ThreePlayBot/1.0 (+three.js detection)" },
      cache: "no-store",
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    reader.cancel().catch(() => {});
    const text = new TextDecoder().decode(Buffer.concat(chunks));
    return { text, headers: res.headers };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function frameable(headers: Headers): boolean {
  const xfo = headers.get("x-frame-options")?.toLowerCase();
  if (xfo && (xfo.includes("deny") || xfo.includes("sameorigin"))) return false;
  const csp = headers.get("content-security-policy")?.toLowerCase() ?? "";
  const fa = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("frame-ancestors"));
  if (fa && !fa.includes("*") && !fa.includes("https:")) return false;
  return true;
}

/** Scan arbitrary source text (HTML or JS) for Three.js fingerprints. */
export function scanSource(text: string, signals: Set<string>) {
  for (const { re, label } of PATTERNS) if (re.test(text)) signals.add(label);
  return text.match(REVISION_RE)?.[1] ?? text.match(THREE_VERSION_URL_RE)?.[1] ?? null;
}

/** Fetch a game URL and look for evidence of Three.js in the page and its scripts. */
export async function detectThreeJs(rawUrl: string): Promise<DetectionResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { isThreeJs: null, revision: null, signals: [], embeddable: null, error: "Invalid URL" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { isThreeJs: null, revision: null, signals: [], embeddable: null, error: "Only http(s) URLs are supported" };
  }
  if (isPrivateHost(url.hostname)) {
    return { isThreeJs: null, revision: null, signals: [], embeddable: null, error: "Private hosts are not allowed" };
  }

  const page = await fetchText(url.toString());
  if (!page) return { isThreeJs: null, revision: null, signals: [], embeddable: null, error: "Could not fetch the page" };

  const signals = new Set<string>();
  let revision = scanSource(page.text, signals);

  // Follow a handful of script tags (same origin or well-known CDNs).
  const srcs = [...page.text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]!).slice(0, MAX_SCRIPTS);
  const modulePreloads = [...page.text.matchAll(/<link[^>]+rel=["']modulepreload["'][^>]+href=["']([^"']+)["']/gi)].map((m) => m[1]!);
  const candidates = [...srcs, ...modulePreloads].slice(0, MAX_SCRIPTS);

  await Promise.all(
    candidates.map(async (src) => {
      let scriptUrl: URL;
      try {
        scriptUrl = new URL(src, url);
      } catch {
        return;
      }
      if (isPrivateHost(scriptUrl.hostname)) return;
      if (/three/i.test(scriptUrl.pathname)) signals.add("three.js bundle file");
      const script = await fetchText(scriptUrl.toString());
      if (!script) return;
      const rev = scanSource(script.text, signals);
      revision ??= rev;
    }),
  );

  return {
    isThreeJs: signals.size > 0,
    revision,
    signals: [...signals],
    embeddable: frameable(page.headers),
  };
}

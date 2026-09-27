import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            { protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
            { protocol: "http" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
          ]
        : []),
      { protocol: "https", hostname: "threejs.org", pathname: "/examples/screenshots/**" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      // Site pages must not be framed by others. Hosted builds under /play set their own headers.
      { source: "/((?!play/).*)", headers: [...security, { key: "Content-Security-Policy", value: "frame-ancestors 'self'" }] },
    ];
  },
};

export default nextConfig;

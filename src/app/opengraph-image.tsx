import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "radial-gradient(circle at 80% 20%, #3a2a8a 0%, #12121f 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32">
          <path d="M16 2 29 9.5v13L16 30 3 22.5v-13Z M16 2v28 M3 9.5l13 7.5 13-7.5" fill="none" stroke="#8b6cff" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="m13 12.5 7 4-7 4Z" fill="#4fd6f0" />
        </svg>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, marginTop: 30, letterSpacing: -3 }}>
          Three<span style={{ color: "#8b6cff" }}>Play</span>
        </div>
        <div style={{ fontSize: 40, marginTop: 10, color: "#b9b6d3" }}>{SITE.tagline}</div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { CATEGORIES, PLATFORM } from "@/lib/site";

export const alt = `${PLATFORM.name} – ${PLATFORM.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Obrazek do udostępniania linku (Facebook, Messenger, WhatsApp) – wspólny dla całej strony. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#FAF7F1", color: "#1F4A42" }}>
        <div style={{ fontSize: 92, fontWeight: 700 }}>{PLATFORM.name}</div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#55655f", maxWidth: 900 }}>{PLATFORM.tagline}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 56 }}>
          {CATEGORIES.map((c) => (
            <div key={c.slug} style={{ padding: "10px 24px", borderRadius: 999, background: "#1F4A42", color: "#fff", fontSize: 28, fontWeight: 700 }}>{c.name}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

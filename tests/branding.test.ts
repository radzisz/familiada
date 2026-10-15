import { describe, expect, it } from "vitest";
import { coOrganizerFrom, HOST_PARTNER, isLogoSource, PARTNER_LOGO_MAX, partnersFor, storedText } from "@/lib/branding";

const DATA = "data:image/webp;base64,UklGRhIAAABXRUJQ";

describe("isLogoSource", () => {
  it("accepts cropped data URLs and app logo files", () => {
    expect(isLogoSource(DATA)).toBe(true);
    expect(isLogoSource("data:image/jpeg;base64,/9j/4AAQ==")).toBe(true);
    expect(isLogoSource("/logos/wspolnota-malzenstw.png")).toBe(true);
  });

  it("rejects other schemes, svg data and paths outside /logos", () => {
    expect(isLogoSource("https://example.com/a.png")).toBe(false);
    expect(isLogoSource("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
    expect(isLogoSource("data:text/html;base64,PGI+")).toBe(false);
    expect(isLogoSource("/logos/../secret.png")).toBe(false);
    expect(isLogoSource("javascript:alert(1)")).toBe(false);
    expect(isLogoSource("")).toBe(false);
  });

  it("rejects logos over the size limit", () => {
    expect(isLogoSource(`data:image/png;base64,${"A".repeat(PARTNER_LOGO_MAX)}`)).toBe(false);
  });
});

describe("storedText", () => {
  it("trims and turns empty into null", () => {
    expect(storedText("  Kraków 2026 ")).toBe("Kraków 2026");
    expect(storedText("   ")).toBeNull();
  });
});

describe("partnersFor / coOrganizerFrom", () => {
  it("always starts with YoungTree", () => {
    expect(partnersFor(null)).toEqual([HOST_PARTNER]);
    const co = { name: "Wspólnota", url: null, logo: DATA };
    expect(partnersFor(co)).toEqual([HOST_PARTNER, { name: "Wspólnota", href: null, src: DATA, fill: true }]);
  });

  it("app logo files keep their margin in the disc", () => {
    expect(partnersFor({ name: "W", url: "https://w.pl/", logo: "/logos/w.png" })[1]?.fill).toBe(false);
  });

  it("needs both a name and a valid logo", () => {
    expect(coOrganizerFrom(null, null, DATA)).toBeNull();
    expect(coOrganizerFrom("W", null, null)).toBeNull();
    expect(coOrganizerFrom("W", null, "https://x/y.png")).toBeNull();
    expect(coOrganizerFrom("W", "", DATA)).toEqual({ name: "W", url: null, logo: DATA });
  });
});

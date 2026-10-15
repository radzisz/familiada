import { describe, expect, it } from "vitest";
import { coOrganizerFrom, HOST_PARTNER, isLogoSource, isServedLogo, logoUrl, PARTNER_LOGO_MAX, partnersFor, storedText } from "@/lib/branding";

const ID_OK = "45d729d1-2925-4825-bea1-30dd887e13a4";
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
  const ID = "45d729d1-2925-4825-bea1-30dd887e13a4";

  it("always starts with YoungTree; the co-organizer logo fills its disc", () => {
    expect(partnersFor(null)).toEqual([HOST_PARTNER]);
    const co = { name: "Wspólnota", url: null, logo: logoUrl(ID, 7) };
    expect(partnersFor(co)).toEqual([HOST_PARTNER, { name: "Wspólnota", href: null, src: logoUrl(ID, 7), fill: true }]);
  });

  it("needs both a name and an uploaded logo (version)", () => {
    expect(coOrganizerFrom(ID, { partner_name: null, partner_url: null, partner_logo_version: 1 })).toBeNull();
    expect(coOrganizerFrom(ID, { partner_name: "W", partner_url: null, partner_logo_version: null })).toBeNull();
    expect(coOrganizerFrom(ID, { partner_name: "W", partner_url: "", partner_logo_version: 3 }))
      .toEqual({ name: "W", url: null, logo: `/api/logo/${ID}?v=3` });
  });
});

describe("isServedLogo", () => {
  it("recognizes only versioned logo URLs", () => {
    expect(isServedLogo(logoUrl(ID_OK, 1712345678901))).toBe(true);
    expect(isServedLogo(`/api/logo/${ID_OK}`)).toBe(false);
    expect(isServedLogo(`/api/logo/${ID_OK}?v=1&x=2`)).toBe(false);
    expect(isServedLogo("/api/logo/../admin?v=1")).toBe(false);
    expect(isServedLogo(DATA)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createSessionToken, pinMatches, SESSION_TTL_MS, verifySessionToken } from "@/lib/token";

describe("session token", () => {
  const now = 1_700_000_000_000;
  it("verifies a fresh token", () => {
    expect(verifySessionToken(createSessionToken("1234", now), "1234", now + 1000)).toBe(true);
  });
  it("rejects expired, tampered, foreign and missing tokens", () => {
    const token = createSessionToken("1234", now);
    expect(verifySessionToken(token, "1234", now + SESSION_TTL_MS + 1)).toBe(false);
    expect(verifySessionToken(token.replace(/^\d/, "9"), "1234", now)).toBe(false);
    expect(verifySessionToken(token, "9999", now)).toBe(false);
    expect(verifySessionToken(undefined, "1234", now)).toBe(false);
    expect(verifySessionToken("garbage", "1234", now)).toBe(false);
  });
  it("refuses to sign without a secret", () => {
    expect(() => createSessionToken("", now)).toThrow();
  });
});

describe("pinMatches", () => {
  it("compares pins", () => {
    expect(pinMatches("1234", "1234")).toBe(true);
    expect(pinMatches("123", "1234")).toBe(false);
    expect(pinMatches("", "")).toBe(false);
  });
});

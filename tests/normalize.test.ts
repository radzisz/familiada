import { describe, expect, it } from "vitest";
import { cleanRawAnswer, labelFromRaw, normalizeAnswer } from "@/lib/normalize";

describe("normalizeAnswer", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeAnswer("Ubrania!")).toBe("ubrania");
    expect(normalizeAnswer("  Ciuchy,  buty ")).toBe("ciuchy buty");
  });
  it("removes Polish diacritics including ł", () => {
    expect(normalizeAnswer("Żółć ŁĄKA")).toBe("zolc laka");
    expect(normalizeAnswer("świeże pączki")).toBe("swieze paczki");
  });
  it("returns empty string for punctuation only", () => {
    expect(normalizeAnswer("?!...")).toBe("");
    expect(normalizeAnswer("")).toBe("");
  });
  it("keeps digits", () => {
    expect(normalizeAnswer("500+")).toBe("500");
  });
});

describe("cleanRawAnswer", () => {
  it("rejects empty and punctuation-only answers", () => {
    expect(cleanRawAnswer("   ", 60)).toBeNull();
    expect(cleanRawAnswer("—", 60)).toBeNull();
  });
  it("collapses whitespace and truncates", () => {
    expect(cleanRawAnswer("  a   b ", 60)).toBe("a b");
    expect(cleanRawAnswer("x".repeat(80), 60)).toHaveLength(60);
  });
  it("throws on invalid max length", () => {
    expect(() => cleanRawAnswer("a", 0)).toThrow();
  });
});

describe("labelFromRaw", () => {
  it("capitalizes and trims edge punctuation", () => {
    expect(labelFromRaw("ubrania!")).toBe("Ubrania");
    expect(labelFromRaw("„żelazko”")).toBe("Żelazko");
  });
});

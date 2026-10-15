import { describe, expect, it } from "vitest";
import { isFiltering, matchesQuestion, NO_FILTER } from "@/lib/questionFilter";

const q = { text: "Co mąż najczęściej GUBI?", audience: "wife" as const };

describe("matchesQuestion", () => {
  it("passes everything without a filter", () => {
    expect(matchesQuestion(q, NO_FILTER)).toBe(true);
    expect(isFiltering(NO_FILTER)).toBe(false);
  });

  it("filters by audience", () => {
    expect(matchesQuestion(q, { audience: "wife", query: "" })).toBe(true);
    expect(matchesQuestion(q, { audience: "husband", query: "" })).toBe(false);
  });

  it("matches text ignoring case, diacritics and punctuation", () => {
    expect(matchesQuestion(q, { audience: null, query: "maz najczesciej" })).toBe(true);
    expect(matchesQuestion(q, { audience: null, query: "gubi?" })).toBe(true);
    expect(matchesQuestion(q, { audience: null, query: "żona" })).toBe(false);
    expect(isFiltering({ audience: null, query: "  " })).toBe(false);
  });
});

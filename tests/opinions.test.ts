import { describe, expect, it } from "vitest";
import { npsScore, prepareOpinion } from "@/lib/opinions";

describe("opinions", () => {
  it("NPS: polecający 9–10 minus krytycy 1–6", () => {
    expect(npsScore([])).toBeNull();
    expect(npsScore([10, 9, 8, 7, 6])).toBe(20);
    expect(npsScore([1, 2, 10])).toBe(-33);
  });

  it("odrzuca oceny spoza skali pytania", () => {
    const stored = prepareOpinion({ w1: "5", w2: "6", nps: "10", f1: "0", o1: "  super  " });
    expect(stored.map((a) => [a.id, a.answer])).toEqual([["w1", "5"], ["o1", "super"], ["nps", "10"]]);
  });
});

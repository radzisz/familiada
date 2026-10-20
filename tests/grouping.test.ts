import { describe, expect, it } from "vitest";
import { planBasicGrouping, reconcileAiGroups, uniqueAnswers } from "@/lib/grouping";
import type { ScoringAnswer } from "@/lib/scoring";

const ans = (normalized: string, groupId: string | null = null, raw = normalized): ScoringAnswer => ({
  normalized, groupId, raw,
});

describe("uniqueAnswers", () => {
  it("counts by normalized and picks the most common raw", () => {
    const u = uniqueAnswers([ans("ciuchy", null, "Ciuchy"), ans("ciuchy", null, "ciuchy"), ans("ciuchy", null, "Ciuchy")]);
    expect(u).toEqual([{ normalized: "ciuchy", count: 3, sampleRaw: "Ciuchy" }]);
  });
});

describe("planBasicGrouping", () => {
  it("attaches to an existing group with the same normalized answer", () => {
    const plan = planBasicGrouping([ans("buty", "g1"), ans("buty"), ans("kawa")]);
    expect(plan.attach).toEqual([{ normalized: "buty", groupId: "g1" }]);
    expect(plan.create).toEqual([{ label: "Kawa", members: ["kawa"] }]);
  });
  it("does nothing when everything is grouped", () => {
    expect(planBasicGrouping([ans("a", "g")])).toEqual({ attach: [], create: [] });
  });
});

describe("reconcileAiGroups", () => {
  const uniques = uniqueAnswers([
    ans("ciuchy", null, "Ciuchy"), ans("ubrania", null, "ubrania!"), ans("bluzki", null, "Bluzki"), ans("kawa"),
  ]);
  it("keeps a valid AI grouping (Ciuchy, ubrania!, Bluzki → Ubrania)", () => {
    const result = reconcileAiGroups(
      [{ label: "Ubrania", members: ["ciuchy", "ubrania", "bluzki"] }, { label: "kawa", members: ["kawa"] }],
      uniques,
    );
    expect(result).toEqual([
      { label: "Ubrania", members: ["ciuchy", "ubrania", "bluzki"] },
      { label: "Kawa", members: ["kawa"] },
    ]);
  });
  it("drops unknown and duplicated members, adds missing ones, merges groups with the same label", () => {
    const result = reconcileAiGroups(
      [{ label: "Ubrania", members: ["ciuchy", "nieznane", "ciuchy"] }, { label: "Puste", members: ["ciuchy"] }],
      uniques,
    );
    expect(result.map((g) => g.label)).toEqual(["Ubrania", "Bluzki", "Kawa"]);
    expect(result[0]!.members).toEqual(["ciuchy", "ubrania"]);
    expect(result.flatMap((g) => g.members).sort()).toEqual(["bluzki", "ciuchy", "kawa", "ubrania"]);
  });
  it("handles an empty AI response", () => {
    expect(reconcileAiGroups([], uniques)).toHaveLength(4);
  });
});

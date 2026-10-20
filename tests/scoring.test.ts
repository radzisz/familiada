import { describe, expect, it } from "vitest";
import { boardAnswers, tallyGroups, type ScoringAnswer } from "@/lib/scoring";

const ans = (normalized: string, groupId: string | null = null, raw = normalized): ScoringAnswer => ({
  normalized, groupId, raw,
});

describe("boardAnswers", () => {
  it("computes percent of respondents, sorted descending", () => {
    const answers = [ans("a", "g1"), ans("b", "g1"), ans("c", "g2"), ans("d", null)];
    const groups = [{ id: "g1", label: "Ubrania", hidden: false }, { id: "g2", label: "Buty", hidden: false }];
    expect(boardAnswers(answers, groups)).toEqual([
      { label: "Ubrania", points: 50 },
      { label: "Buty", points: 25 },
      { label: "d", points: 25 },
    ]);
  });
  it("limits to top 6", () => {
    const answers = "abcdefgh".split("").map((c) => ans(c));
    expect(boardAnswers(answers, [])).toHaveLength(6);
  });
  it("skips hidden groups but keeps them in the denominator", () => {
    const answers = [ans("x", "h"), ans("x", "h"), ans("y", "g")];
    const groups = [{ id: "h", label: "Brzydkie", hidden: true }, { id: "g", label: "Dobre", hidden: false }];
    expect(boardAnswers(answers, groups)).toEqual([{ label: "Dobre", points: 33 }]);
  });
  it("never shows the same answer twice: same-label groups merge", () => {
    const answers = [ans("ubrania", "g1"), ans("ciuchy", "g1"), ans("bluzki", "g2"), ans("kawa", "g3")];
    const groups = [
      { id: "g1", label: "Ubrania", hidden: false },
      { id: "g2", label: "ubrania!", hidden: false },
      { id: "g3", label: "Kawa", hidden: false },
    ];
    expect(boardAnswers(answers, groups)).toEqual([{ label: "Ubrania", points: 75 }, { label: "Kawa", points: 25 }]);
  });
  it("counts a late ungrouped answer into the group that already has it", () => {
    const answers = [ans("pieniadze", "g1", "Pieniądze"), ans("kasa", "g1"), ans("pieniadze", null, "pieniadze")];
    const groups = [{ id: "g1", label: "Pieniądze", hidden: false }];
    expect(boardAnswers(answers, groups)).toEqual([{ label: "Pieniądze", points: 100 }]);
  });
  it("returns empty for no answers", () => {
    expect(boardAnswers([], [])).toEqual([]);
  });
  it("groups ungrouped answers by normalized using the most common raw form", () => {
    const answers = [ans("ubrania", null, "Ubrania"), ans("ubrania", null, "ubrania!"), ans("ubrania", null, "Ubrania")];
    expect(tallyGroups(answers, [])[0]).toMatchObject({ label: "Ubrania", count: 3, points: 100 });
  });
});

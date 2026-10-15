import { describe, expect, it } from "vitest";
import rawPools from "@/lib/data/test-answers.json";
import questions from "@/lib/data/questions.json";
import { buildTestAnswers, parsePools, pickAnswer, type Concept } from "@/lib/testAnswers";

const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe("parsePools", () => {
  it("covers every default question and skips the description key", () => {
    const pools = parsePools(rawPools);
    expect(Object.keys(pools)).not.toContain("_info");
    expect(questions.every((q) => pools[q.text] !== undefined)).toBe(true);
  });
  it("drops malformed concepts", () => {
    expect(parsePools({ q: [[0, "x"], [2], ["a", "b"], [1, "ok"]] })).toEqual({ q: [[1, "ok"]] });
  });
});

describe("pickAnswer", () => {
  const concepts: Concept[] = [[3, "a1", "a2"], [1, "b"]];
  it("picks concepts by weight", () => {
    expect(pickAnswer(concepts, seq([0.1, 0]))).toBe("a1");
    expect(pickAnswer(concepts, seq([0.9, 0]))).toBe("b");
  });
  it("picks a variant within the concept", () => {
    expect(pickAnswer(concepts, seq([0.1, 0.99]))).toBe("a2");
  });
});

describe("buildTestAnswers", () => {
  const qs = [
    { id: "1", audience: "all" as const, text: "Q all" },
    { id: "2", audience: "wife" as const, text: "Q wife" },
    { id: "3", audience: "husband" as const, text: "Q husband" },
    { id: "4", audience: "all" as const, text: "Q without pool" },
  ];
  const pools = { "Q all": [[1, "x"]], "Q wife": [[1, "y"]], "Q husband": [[1, "z"]] } as Record<string, Concept[]>;
  it("answers only questions for the role that have a pool", () => {
    const answers = buildTestAnswers(qs, pools, "wife", () => 0);
    expect(answers).toEqual([{ questionId: "1", text: "x" }, { questionId: "2", text: "y" }]);
  });
  it("skips questions when the dice say so", () => {
    expect(buildTestAnswers(qs, pools, "husband", () => 0.99)).toEqual([]);
  });
});

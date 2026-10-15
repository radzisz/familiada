import { describe, expect, it } from "vitest";
import { prepareAnswers } from "@/lib/submission";

describe("prepareAnswers", () => {
  it("drops empty answers and keeps the first answer per question", () => {
    const out = prepareAnswers([
      { questionId: "a", text: "  Ciuchy! " },
      { questionId: "b", text: "   " },
      { questionId: "a", text: "drugie" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ question_id: "a", raw: "Ciuchy!" });
    expect(out[0]!.normalized).toBe("ciuchy");
  });
});

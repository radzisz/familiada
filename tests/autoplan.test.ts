import { describe, expect, it } from "vitest";
import { autoPlan, finalScore, roundScore, type PlanCandidate } from "@/lib/autoplan";
import { emptyPlan, type Audience, type BoardAnswer } from "@/lib/types";

let seq = 0;
function cand(audience: Audience, points: number[], respondents = 20): PlanCandidate {
  seq += 1;
  const board: BoardAnswer[] = points.map((p, i) => ({ label: `a${i}`, points: p }));
  return { id: `q${seq}`, audience, position: seq, respondents, board };
}

const spread = [30, 20, 15, 10, 8, 5];
const leader = [70, 20];

describe("roundScore / finalScore", () => {
  it("prefers a full board with high coverage for rounds", () => {
    expect(roundScore(cand("all", spread))).toBeGreaterThan(roundScore(cand("all", [40, 30])));
  });
  it("prefers a clear leader for the final", () => {
    expect(finalScore(cand("all", leader))).toBeGreaterThan(finalScore(cand("all", spread)));
  });
  it("rejects questions with too few respondents or answers", () => {
    expect(roundScore(cand("all", spread, 2))).toBe(0);
    expect(roundScore(cand("all", [100]))).toBe(0);
    expect(finalScore(cand("all", [100]))).toBe(0);
    expect(finalScore(cand("all", [], 0))).toBe(0);
  });
});

describe("autoPlan", () => {
  it("puts husband questions in round 2 and wife questions in round 3", () => {
    const h = cand("husband", spread);
    const w = cand("wife", spread);
    const all = [cand("all", spread), cand("all", spread), cand("all", spread)];
    const plan = autoPlan([...all, h, w], emptyPlan(), "all");
    expect(plan.rounds[1]).toBe(h.id);
    expect(plan.rounds[2]).toBe(w.id);
    expect(all.map((c) => c.id)).toEqual(expect.arrayContaining([plan.rounds[0], plan.rounds[3], plan.rounds[4]]));
  });

  it("never uses a question twice and leaves slots empty when candidates run out", () => {
    const cands = [cand("all", spread), cand("all", leader), cand("wife", spread)];
    const plan = autoPlan(cands, emptyPlan(), "all");
    const ids = [...plan.rounds, ...plan.final].filter((id) => id !== null);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(3);
  });

  it("falls back to any audience when no matching question exists", () => {
    const cands = [cand("all", spread), cand("all", spread)];
    const plan = autoPlan(cands, emptyPlan(), "all");
    expect(plan.rounds[1]).not.toBeNull();
  });

  it("gives the final to clear-leader questions", () => {
    const leaders = Array.from({ length: 5 }, () => cand("all", leader));
    const rounds = Array.from({ length: 5 }, () => cand("all", spread));
    const plan = autoPlan([...rounds, ...leaders], emptyPlan(), "all");
    expect([...plan.final].sort()).toEqual(leaders.map((c) => c.id).sort());
  });

  it("prefers shared questions in the final, falls back to any audience", () => {
    const wifeLeader = cand("wife", [90, 10]);
    const shared = cand("all", [50, 30]);
    const plan = autoPlan([wifeLeader, shared], emptyPlan(), "all");
    expect(plan.final[0]).toBe(shared.id);
    expect(plan.final[1]).toBe(wifeLeader.id);
  });

  it("mode fill keeps manual choices, mode all replaces them", () => {
    const manual = cand("all", [40, 30]);
    const cands = [manual, ...Array.from({ length: 12 }, () => cand("all", spread))];
    const current = { ...emptyPlan(), rounds: [manual.id, null, null, null, null] };
    expect(autoPlan(cands, current, "fill").rounds[0]).toBe(manual.id);
    expect(autoPlan(cands, current, "all").rounds).not.toContain(manual.id);
  });

  it("mode fill drops ids of questions that are no longer candidates", () => {
    const cands = Array.from({ length: 12 }, () => cand("all", spread));
    const current = { ...emptyPlan(), final: ["gone", null, null, null, null] };
    expect(autoPlan(cands, current, "fill").final).not.toContain("gone");
  });
});

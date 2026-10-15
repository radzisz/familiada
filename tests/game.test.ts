import { describe, expect, it } from "vitest";
import { finalTotal, gameReducer, initialGameState, NONE, parseGameState, potValue, type GameState } from "@/lib/game";

const answers = [{ label: "A", points: 40 }, { label: "B", points: 30 }, { label: "C", points: 20 }];
const run = (state: GameState, ...actions: Parameters<typeof gameReducer>[1][]) => actions.reduce(gameReducer, state);

describe("gameReducer – rounds", () => {
  it("reveals a slot once and bumps rev", () => {
    const s = run(initialGameState(), { type: "reveal", index: 1, slotCount: 3 }, { type: "reveal", index: 1, slotCount: 3 });
    expect(s.revealed).toEqual([1]);
    expect(s.rev).toBe(1);
  });
  it("ignores reveal outside the board", () => {
    const s0 = initialGameState();
    expect(gameReducer(s0, { type: "reveal", index: 5, slotCount: 3 })).toBe(s0);
  });
  it("caps strikes at 3", () => {
    const s = run(initialGameState(), { type: "strike" }, { type: "strike" }, { type: "strike" }, { type: "strike" });
    expect(s.strikes).toBe(3);
  });
  it("awards pot × multiplier only once per round and reveals the rest", () => {
    const s = run(
      { ...initialGameState(), round: 4 },
      { type: "reveal", index: 0, slotCount: 3 },
      { type: "reveal", index: 2, slotCount: 3 },
      { type: "award", team: "w", answers },
      { type: "award", team: "h", answers },
    );
    expect(s.scoreW).toBe((40 + 20) * 2);
    expect(s.scoreH).toBe(0);
    expect(s.revealed).toEqual([0, 1, 2]);
  });
  it("uses ×3 in round 5", () => {
    const s = run({ ...initialGameState(), round: 5 }, { type: "reveal", index: 1, slotCount: 3 }, { type: "award", team: "h", answers });
    expect(s.scoreH).toBe(90);
  });
  it("next clears the board and stops at round 5", () => {
    const s = run({ ...initialGameState(), round: 5, strikes: 2, revealed: [0] }, { type: "next" });
    expect(s).toMatchObject({ round: 5, strikes: 0, revealed: [] });
  });
  it("reset zeroes scores", () => {
    const s = run({ ...initialGameState(), scoreW: 100, round: 3, awarded: [1] }, { type: "reset" });
    expect(s).toMatchObject({ scoreW: 0, round: 1, awarded: [] });
  });
  it("potValue sums revealed points", () => {
    expect(potValue({ ...initialGameState(), revealed: [0, 1] }, answers)).toBe(70);
  });
});

describe("gameReducer – final", () => {
  const finals = Array.from({ length: 5 }, () => answers);
  it("blocks person 2 from repeating person 1's answer", () => {
    const s = run(initialGameState(), { type: "finalPick", person: "p1", question: 0, answer: 0 });
    expect(gameReducer(s, { type: "finalPick", person: "p2", question: 0, answer: 0 })).toBe(s);
  });
  it("clears person 2 when person 1 switches to the same answer", () => {
    const s = run(
      initialGameState(),
      { type: "finalPick", person: "p2", question: 0, answer: 1 },
      { type: "finalPick", person: "p1", question: 0, answer: 1 },
    );
    expect(s.final.p2[0]).toBe(NONE);
  });
  it("sums both columns", () => {
    const s = run(
      initialGameState(),
      { type: "finalPick", person: "p1", question: 0, answer: 0 },
      { type: "finalPick", person: "p2", question: 0, answer: 1 },
      { type: "finalPick", person: "p1", question: 4, answer: 2 },
    );
    expect(finalTotal(s, finals)).toBe(90);
  });
  it("starts and stops the timer", () => {
    const s = gameReducer(initialGameState(), { type: "timerStart", seconds: 20, now: 1000 });
    expect(s.timerEndsAt).toBe(21000);
    expect(gameReducer(s, { type: "timerStop" }).timerEndsAt).toBeNull();
  });
});

describe("parseGameState", () => {
  it("falls back to defaults for garbage", () => {
    expect(parseGameState(null)).toEqual(initialGameState());
    expect(parseGameState({ round: 99, strikes: -4, final: { p1: [1] } })).toMatchObject({ round: 1, strikes: 0 });
  });
  it("round-trips a valid state", () => {
    const s = run(initialGameState(), { type: "strike" }, { type: "setView", view: "final" });
    expect(parseGameState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

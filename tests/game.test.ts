import { describe, expect, it } from "vitest";
import { finalTotal, gameReducer, initialGameState, MAX_HISTORY, nextStep, NONE, parseGameState, potValue, QUESTION_COUNTDOWN_S, type GameState } from "@/lib/game";

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
  it("next clears the board and moves to the next round", () => {
    const s = run({ ...initialGameState(), round: 2, questionShown: true, strikes: 2, revealed: [0] }, { type: "next", answers, now: 1000 });
    expect(s).toMatchObject({ view: "game", round: 3, strikes: 0, revealed: [] });
  });
  it("next after round 5 switches to the final and keeps scores", () => {
    const s = run({ ...initialGameState(), round: 5, questionShown: true, scoreW: 120, revealed: [0, 1] }, { type: "next", answers, now: 1000 });
    expect(s).toMatchObject({ view: "final", round: 5, scoreW: 120 });
  });
  it("next in the final changes nothing", () => {
    const start = { ...initialGameState(), view: "final" as const, round: 5 };
    expect(run(start, { type: "next", answers, now: 1000 })).toEqual(start);
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

describe("gameReducer – question reveal (Dalej pokazuje pytanie)", () => {
  it("a new game starts with the question hidden", () => {
    expect(initialGameState().questionShown).toBe(false);
  });
  it("first next shows the question and stays in the round", () => {
    const s = run(initialGameState(), { type: "next", answers, now: 1000 });
    expect(s).toMatchObject({ round: 1, questionShown: true });
  });
  it("second next moves to the next round with its question hidden", () => {
    const s = run(initialGameState(), { type: "next", answers, now: 1000 }, { type: "next", answers, now: 1000 });
    expect(s).toMatchObject({ round: 2, questionShown: false });
  });
  it("showing the question starts the answer countdown; the next round clears it", () => {
    const shown = run(initialGameState(), { type: "next", answers, now: 1000 });
    expect(shown.questionEndsAt).toBe(1000 + QUESTION_COUNTDOWN_S * 1000);
    expect(run(shown, { type: "next", answers, now: 9000 }).questionEndsAt).toBeNull();
  });
  it("parseGameState keeps a valid countdown end and drops a bad one", () => {
    expect(parseGameState({ questionEndsAt: 5000 }).questionEndsAt).toBe(5000);
    expect(parseGameState({ questionEndsAt: "x" }).questionEndsAt).toBeNull();
  });
  it("nextStep tells what Dalej will do", () => {
    const base = initialGameState();
    expect(nextStep(base)).toBe("question");
    expect(nextStep({ ...base, questionShown: true })).toBe("round");
    expect(nextStep({ ...base, round: 5, questionShown: true })).toBe("final");
    expect(nextStep({ ...base, view: "final" })).toBeNull();
  });
  it("parseGameState treats a saved state without the flag as already shown", () => {
    expect(parseGameState({ round: 3 }).questionShown).toBe(true);
    expect(parseGameState({ round: 3, questionShown: false }).questionShown).toBe(false);
  });
});

describe("gameReducer – turn (czyja pula)", () => {
  it("setTurn picks and switches the team holding the pot", () => {
    const s = run(initialGameState(), { type: "setTurn", team: "w" }, { type: "setTurn", team: "h" });
    expect(s.turn).toBe("h");
  });
  it("revealAll only shows the remaining answers – no points and they do not count to the pot", () => {
    const s = run(initialGameState(), { type: "setTurn", team: "w" }, { type: "reveal", index: 0, slotCount: 3 }, { type: "revealAll", answers });
    expect(s).toMatchObject({ scoreW: 0, scoreH: 0, awarded: [], revealed: [0], uncovered: [1, 2] });
    expect(potValue(s, answers)).toBe(40);
  });
  it("next awards only answers revealed in play (not the ones shown by revealAll)", () => {
    const s = run(
      { ...initialGameState(), questionShown: true }, { type: "setTurn", team: "w" },
      { type: "reveal", index: 0, slotCount: 3 }, { type: "revealAll", answers }, { type: "next", answers, now: 1000 },
    );
    expect(s).toMatchObject({ scoreW: 40, round: 2, uncovered: [], revealed: [] });
  });
  it("next awards an unawarded pot to the turn team and clears the turn for the new round", () => {
    const s = run({ ...initialGameState(), round: 4, questionShown: true }, { type: "setTurn", team: "h" }, { type: "reveal", index: 1, slotCount: 3 }, { type: "next", answers, now: 1000 });
    expect(s).toMatchObject({ scoreH: 60, round: 5, turn: null, awarded: [4] });
  });
  it("clicking an answer shown by revealAll does not add it to the pot", () => {
    const s = run(initialGameState(), { type: "revealAll", answers }, { type: "reveal", index: 1, slotCount: 3 });
    expect(s.revealed).toEqual([]);
  });
  it("conceal also hides an answer shown by revealAll", () => {
    const s = run(initialGameState(), { type: "revealAll", answers }, { type: "conceal", index: 2 });
    expect(s.uncovered).toEqual([0, 1]);
  });
  it("parseGameState keeps uncovered answers", () => {
    expect(parseGameState({ uncovered: [1, 2] }).uncovered).toEqual([1, 2]);
    expect(parseGameState({ uncovered: "x" }).uncovered).toEqual([]);
  });
  it("parseGameState keeps a valid turn and drops a bad one", () => {
    expect(parseGameState({ turn: "h" }).turn).toBe("h");
    expect(parseGameState({ turn: "x" }).turn).toBeNull();
  });
});

describe("gameReducer – conceal", () => {
  it("conceal hides a revealed answer again", () => {
    const s = run(initialGameState(), { type: "reveal", index: 0, slotCount: 3 }, { type: "reveal", index: 2, slotCount: 3 }, { type: "conceal", index: 0 });
    expect(s.revealed).toEqual([2]);
  });
  it("conceal of a hidden answer changes nothing", () => {
    const start = initialGameState();
    expect(run(start, { type: "conceal", index: 1 })).toBe(start);
  });
});

describe("gameReducer – undo", () => {
  it("undo reverts the last action (e.g. a wrong strike) and still bumps rev", () => {
    const s = run(initialGameState(), { type: "reveal", index: 0, slotCount: 3 }, { type: "strike" }, { type: "undo" });
    expect(s).toMatchObject({ strikes: 0, revealed: [0], rev: 3 });
  });
  it("undo reverts an awarded pot", () => {
    const s = run(initialGameState(), { type: "reveal", index: 0, slotCount: 3 }, { type: "award", team: "w", answers }, { type: "undo" });
    expect(s).toMatchObject({ scoreW: 0, awarded: [], revealed: [0] });
  });
  it("undo steps back several actions, then does nothing when history is empty", () => {
    const s = run(initialGameState(), { type: "strike" }, { type: "strike" }, { type: "undo" }, { type: "undo" }, { type: "undo" });
    expect(s.strikes).toBe(0);
    expect(s.history).toEqual([]);
  });
  it("undo after next goes back to the previous round with its board", () => {
    const s = run({ ...initialGameState(), round: 2, questionShown: true, revealed: [0, 1], strikes: 1 }, { type: "next", answers, now: 1000 }, { type: "undo" });
    expect(s).toMatchObject({ round: 2, revealed: [0, 1], strikes: 1 });
  });
  it("timer actions are not recorded in history", () => {
    const s = run(initialGameState(), { type: "strike" }, { type: "timerStart", seconds: 20, now: 1000 }, { type: "undo" });
    expect(s.strikes).toBe(0);
  });
  it("history is bounded", () => {
    const actions = Array.from({ length: MAX_HISTORY + 10 }, () => ({ type: "reveal" as const, index: 0, slotCount: 1 }))
      .flatMap((a) => [a, { type: "conceal" as const, index: 0 }]);
    const s = run(initialGameState(), ...actions);
    expect(s.history.length).toBe(MAX_HISTORY);
  });
  it("parseGameState keeps a valid history and drops a broken one", () => {
    const s = run(initialGameState(), { type: "strike" });
    expect(parseGameState(JSON.parse(JSON.stringify(s))).history).toHaveLength(1);
    expect(parseGameState({ ...s, history: "x" }).history).toEqual([]);
  });
});

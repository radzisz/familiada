import { describe, expect, it } from "vitest";
import { finalTotal, gameReducer, initialGameState, MAX_HISTORY, nextStep, NONE, parseGameState, potValue, QUESTION_COUNTDOWN_S, type GameState, WRONG, FINAL_SECONDS, finalNextHint, finalPerson, finalQuestionOnBoard } from "@/lib/game";

const answers = [{ label: "A", points: 40 }, { label: "B", points: 30 }, { label: "C", points: 20 }];
/** Stan startowy z drużyną Żon przy odpowiadaniu (błędy trafiają do niej). */
const W: GameState = { ...initialGameState(), turn: "w" };
const run = (state: GameState, ...actions: Parameters<typeof gameReducer>[1][]) => actions.reduce(gameReducer, state);

describe("gameReducer – rounds", () => {
  it("reveals a slot once and bumps rev", () => {
    const s = run(W, { type: "reveal", index: 1, slotCount: 3 }, { type: "reveal", index: 1, slotCount: 3 });
    expect(s.revealed).toEqual([1]);
    expect(s.rev).toBe(1);
  });
  it("ignores reveal outside the board", () => {
    const s0 = initialGameState();
    expect(gameReducer(s0, { type: "reveal", index: 5, slotCount: 3 })).toBe(s0);
  });
  it("caps strikes at 3 per team", () => {
    const s = run(W, { type: "strike" }, { type: "strike" }, { type: "strike" }, { type: "strike" });
    expect(s.strikes).toEqual({ w: 3, h: 0 });
  });
  it("gives the strike to the team that is answering", () => {
    const s = run(W, { type: "strike" }, { type: "strike" }, { type: "setTurn", team: "h" }, { type: "strike" });
    expect(s.strikes).toEqual({ w: 2, h: 1 });
  });
  it("ignores revealing an answer when no team is answering (it would not be clear whose pot it is)", () => {
    const s0 = initialGameState();
    expect(gameReducer(s0, { type: "reveal", index: 0, slotCount: 3 })).toBe(s0);
  });
  it("ignores a strike when no team is answering", () => {
    const s0 = initialGameState();
    expect(gameReducer(s0, { type: "strike" })).toBe(s0);
  });
  it("awards pot × multiplier only once per round and leaves hidden answers hidden", () => {
    const s = run(
      { ...W, round: 4 },
      { type: "reveal", index: 0, slotCount: 3 },
      { type: "reveal", index: 2, slotCount: 3 },
      { type: "award", team: "w", answers },
      { type: "award", team: "h", answers },
    );
    expect(s.scoreW).toBe((40 + 20) * 2);
    expect(s.scoreH).toBe(0);
    expect(s.revealed).toEqual([0, 2]);
  });
  it("uses ×3 in round 5", () => {
    const s = run({ ...W, round: 5 }, { type: "reveal", index: 1, slotCount: 3 }, { type: "award", team: "h", answers });
    expect(s.scoreH).toBe(90);
  });
  it("next clears the board and moves to the next round", () => {
    const s = run({ ...initialGameState(), round: 2, questionShown: true, strikes: { w: 2, h: 1 }, revealed: [0] }, { type: "next", answers, now: 1000 });
    expect(s).toMatchObject({ view: "game", round: 3, strikes: { w: 0, h: 0 }, revealed: [] });
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
  it("a wrong answer counts 0 and both people may give a wrong answer", () => {
    const s = run(
      initialGameState(),
      { type: "finalPick", person: "p1", question: 0, answer: WRONG },
      { type: "finalPick", person: "p2", question: 0, answer: WRONG },
      { type: "finalPick", person: "p2", question: 1, answer: 0 },
    );
    expect(s.final.p1[0]).toBe(WRONG);
    expect(s.final.p2[0]).toBe(WRONG);
    expect(finalTotal(s, finals)).toBe(40);
  });
  it("parseGameState keeps wrong answers in the final", () => {
    const final = { p1: [WRONG, 0, NONE, NONE, NONE], p2: [NONE, NONE, NONE, NONE, NONE] };
    expect(parseGameState({ final }).final.p1[0]).toBe(WRONG);
  });
  /** Klika „Dalej” w finale `n` razy, co sekundę od chwili `from`. */
  const nexts = (state: GameState, n: number, from: number) =>
    Array.from({ length: n }, (_, i) => i).reduce((st, i) => gameReducer(st, { type: "finalNext", now: from + i * 1000 }), state);
  it("finalNext: person 1 – timer and question 1, then the next questions one by one", () => {
    const s1 = gameReducer(initialGameState(), { type: "finalNext", now: 1000 });
    expect(s1).toMatchObject({ finalStep: 1, finalQuestion: 0, timerEndsAt: 1000 + FINAL_SECONDS.p1 * 1000 });
    expect(finalQuestionOnBoard(s1, 2000)).toBe(0);
    const s5 = nexts(s1, 4, 2000);
    expect(s5).toMatchObject({ finalStep: 1, finalQuestion: 4, timerEndsAt: s1.timerEndsAt });
    expect(finalNextHint(s5, 6000)).toBe("osoba 2");
  });
  it("questions disappear from the board when the time is up", () => {
    const s1 = gameReducer(initialGameState(), { type: "finalNext", now: 1000 });
    expect(finalQuestionOnBoard(s1, 1000 + FINAL_SECONDS.p1 * 1000)).toBeNull();
  });
  it("after the last question (or when time is up) Dalej goes to person 2 and hides the questions", () => {
    const afterLast = nexts(initialGameState(), 6, 1000);
    expect(afterLast).toMatchObject({ finalStep: 2, finalQuestion: NONE, timerEndsAt: null });
    expect(finalPerson(afterLast)).toBe("p2");
    const s1 = gameReducer(initialGameState(), { type: "finalNext", now: 1000 });
    const late = gameReducer(s1, { type: "finalNext", now: 1000 + FINAL_SECONDS.p1 * 1000 + 1 });
    expect(late).toMatchObject({ finalStep: 2, finalQuestion: NONE });
  });
  it("person 2 runs the same way with the longer timer, then the final ends", () => {
    const s2 = { ...initialGameState(), finalStep: 2 };
    const s3 = gameReducer(s2, { type: "finalNext", now: 1000 });
    expect(s3).toMatchObject({ finalStep: 3, finalQuestion: 0, timerEndsAt: 1000 + FINAL_SECONDS.p2 * 1000 });
    const done = nexts(s3, 5, 2000);
    expect(done).toMatchObject({ finalStep: 4, finalQuestion: NONE, timerEndsAt: null });
    expect(finalNextHint(done, 9000)).toBe("podziękowanie");
  });
  it("after the final Dalej shows the thank-you screen, then does nothing", () => {
    const done = { ...initialGameState(), view: "final" as const, finalStep: 4 };
    const thanks = gameReducer(done, { type: "finalNext", now: 9000 });
    expect(thanks.view).toBe("thanks");
    expect(finalNextHint(thanks, 9000)).toBeNull();
    expect(gameReducer(thanks, { type: "finalNext", now: 9500 })).toBe(thanks);
    expect(gameReducer(thanks, { type: "undo" }).view).toBe("final");
  });
  it("parseGameState keeps the thank-you view", () => {
    expect(parseGameState({ view: "thanks" }).view).toBe("thanks");
  });
  it("undo steps back through the final", () => {
    const s = run(initialGameState(), { type: "finalNext", now: 1000 }, { type: "finalNext", now: 2000 }, { type: "undo" });
    expect(s.finalStep).toBe(1);
  });
  it("finalClear and reset go back to person 1", () => {
    const s = run(initialGameState(), { type: "finalNext", now: 1 }, { type: "finalNext", now: 2 });
    expect(gameReducer(s, { type: "finalClear" }).finalStep).toBe(0);
    expect(gameReducer(s, { type: "reset" }).finalStep).toBe(0);
  });
  it("parseGameState keeps a valid final step and drops a bad one", () => {
    expect(parseGameState({ finalStep: 2 }).finalStep).toBe(2);
    expect(parseGameState({ finalStep: 9 }).finalStep).toBe(0);
    expect(parseGameState({ finalQuestion: 3 }).finalQuestion).toBe(3);
    expect(parseGameState({ finalQuestion: 7 }).finalQuestion).toBe(NONE);
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
    expect(parseGameState({ round: 99, strikes: -4, final: { p1: [1] } })).toMatchObject({ round: 1, strikes: { w: 0, h: 0 } });
    expect(parseGameState({ strikes: { w: 9, h: 2 } }).strikes).toEqual({ w: 3, h: 2 });
  });
  it("round-trips a valid state", () => {
    const s = run(W, { type: "strike" }, { type: "setView", view: "final" });
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
  it("uncoverNext shows hidden answers one by one from the bottom – no points, not in the pot", () => {
    const one = run(initialGameState(), { type: "setTurn", team: "w" }, { type: "reveal", index: 0, slotCount: 3 }, { type: "uncoverNext", slotCount: 3 });
    expect(one).toMatchObject({ scoreW: 0, scoreH: 0, awarded: [], revealed: [0], uncovered: [2] });
    const two = gameReducer(one, { type: "uncoverNext", slotCount: 3 });
    expect(two.uncovered).toEqual([2, 1]);
    expect(potValue(two, answers)).toBe(40);
  });
  it("uncoverNext does nothing when every answer is already shown", () => {
    const s = run(W, { type: "reveal", index: 1, slotCount: 2 }, { type: "uncoverNext", slotCount: 2 });
    expect(s.uncovered).toEqual([0]);
    expect(gameReducer(s, { type: "uncoverNext", slotCount: 2 })).toBe(s);
  });
  it("next awards only answers revealed in play (not the ones shown by uncoverNext)", () => {
    const s = run(
      { ...initialGameState(), questionShown: true }, { type: "setTurn", team: "w" },
      { type: "reveal", index: 0, slotCount: 3 }, { type: "uncoverNext", slotCount: 3 }, { type: "next", answers, now: 1000 },
    );
    expect(s).toMatchObject({ scoreW: 40, round: 2, uncovered: [], revealed: [] });
  });
  it("next awards an unawarded pot to the turn team and clears the turn for the new round", () => {
    const s = run({ ...initialGameState(), round: 4, questionShown: true }, { type: "setTurn", team: "h" }, { type: "reveal", index: 1, slotCount: 3 }, { type: "next", answers, now: 1000 });
    expect(s).toMatchObject({ scoreH: 60, round: 5, turn: null, awarded: [4] });
  });
  it("clicking an answer shown by uncoverNext does not add it to the pot", () => {
    const s = run(initialGameState(), { type: "uncoverNext", slotCount: 3 }, { type: "reveal", index: 2, slotCount: 3 });
    expect(s.revealed).toEqual([]);
  });
  it("conceal also hides an answer shown by uncoverNext", () => {
    const s = run(initialGameState(), { type: "uncoverNext", slotCount: 3 }, { type: "uncoverNext", slotCount: 3 }, { type: "conceal", index: 2 });
    expect(s.uncovered).toEqual([1]);
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
    const s = run(W, { type: "reveal", index: 0, slotCount: 3 }, { type: "reveal", index: 2, slotCount: 3 }, { type: "conceal", index: 0 });
    expect(s.revealed).toEqual([2]);
  });
  it("conceal of a hidden answer changes nothing", () => {
    const start = initialGameState();
    expect(run(start, { type: "conceal", index: 1 })).toBe(start);
  });
});

describe("gameReducer – undo", () => {
  it("undo reverts the last action (e.g. a wrong strike) and still bumps rev", () => {
    const s = run(W, { type: "reveal", index: 0, slotCount: 3 }, { type: "strike" }, { type: "undo" });
    expect(s).toMatchObject({ strikes: { w: 0, h: 0 }, revealed: [0], rev: 3 });
  });
  it("undo reverts an awarded pot", () => {
    const s = run(W, { type: "reveal", index: 0, slotCount: 3 }, { type: "award", team: "w", answers }, { type: "undo" });
    expect(s).toMatchObject({ scoreW: 0, awarded: [], revealed: [0] });
  });
  it("undo steps back several actions, then does nothing when history is empty", () => {
    const s = run(W, { type: "strike" }, { type: "strike" }, { type: "undo" }, { type: "undo" }, { type: "undo" });
    expect(s.strikes).toEqual({ w: 0, h: 0 });
    expect(s.history).toEqual([]);
  });
  it("undo after next goes back to the previous round with its board", () => {
    const s = run({ ...initialGameState(), round: 2, questionShown: true, revealed: [0, 1], strikes: { w: 1, h: 0 } }, { type: "next", answers, now: 1000 }, { type: "undo" });
    expect(s).toMatchObject({ round: 2, revealed: [0, 1], strikes: { w: 1, h: 0 } });
  });
  it("timer actions are not recorded in history", () => {
    const s = run(W, { type: "strike" }, { type: "timerStart", seconds: 20, now: 1000 }, { type: "undo" });
    expect(s.strikes).toEqual({ w: 0, h: 0 });
  });
  it("history is bounded", () => {
    const actions = Array.from({ length: MAX_HISTORY + 10 }, () => ({ type: "reveal" as const, index: 0, slotCount: 1 }))
      .flatMap((a) => [a, { type: "conceal" as const, index: 0 }]);
    const s = run(W, ...actions);
    expect(s.history.length).toBe(MAX_HISTORY);
  });
  it("parseGameState keeps a valid history and drops a broken one", () => {
    const s = run(W, { type: "strike" });
    expect(parseGameState(JSON.parse(JSON.stringify(s))).history).toHaveLength(1);
    expect(parseGameState({ ...s, history: "x" }).history).toEqual([]);
  });
});

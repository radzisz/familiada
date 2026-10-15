import { assert } from "./assert";
import { BOARD_SLOTS, FINAL_COUNT, ROUND_COUNT, type BoardAnswer } from "./types";

export const MULTIPLIER: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 3 };
export const MAX_STRIKES = 3;
export const FINAL_TARGET = 200;
export const NONE = -1;

export type Team = "w" | "h";
export type Person = "p1" | "p2";

export interface GameState {
  /** Rośnie przy każdej zmianie; wyższy numer wygrywa przy synchronizacji urządzeń. */
  rev: number;
  view: "game" | "final";
  round: number;
  revealed: number[];
  strikes: number;
  scoreW: number;
  scoreH: number;
  /** Rundy, w których pula została już przyznana. */
  awarded: number[];
  final: { p1: number[]; p2: number[] };
  timerEndsAt: number | null;
}

export type GameAction =
  | { type: "reveal"; index: number; slotCount: number }
  | { type: "revealAll"; slotCount: number }
  | { type: "strike" }
  | { type: "award"; team: Team; answers: BoardAnswer[] }
  | { type: "next" }
  | { type: "setRound"; round: number }
  | { type: "setView"; view: GameState["view"] }
  | { type: "reset" }
  | { type: "finalPick"; person: Person; question: number; answer: number }
  | { type: "finalClear" }
  | { type: "timerStart"; seconds: number; now: number }
  | { type: "timerStop" };

export function initialGameState(): GameState {
  return {
    rev: 0,
    view: "game",
    round: 1,
    revealed: [],
    strikes: 0,
    scoreW: 0,
    scoreH: 0,
    awarded: [],
    final: { p1: Array(FINAL_COUNT).fill(NONE), p2: Array(FINAL_COUNT).fill(NONE) },
    timerEndsAt: null,
  };
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Suma punktów odkrytych odpowiedzi (bez mnożnika). */
export function potValue(state: GameState, answers: BoardAnswer[]): number {
  return state.revealed.reduce((sum, i) => sum + (answers[i]?.points ?? 0), 0);
}

export function multiplier(round: number): number {
  return MULTIPLIER[round] ?? 1;
}

function freshRound(state: GameState, round: number): GameState {
  return { ...state, round, revealed: [], strikes: 0 };
}

function reveal(state: GameState, index: number, slotCount: number): GameState {
  if (index < 0 || index >= slotCount || state.revealed.includes(index)) return state;
  return { ...state, revealed: [...state.revealed, index] };
}

function award(state: GameState, team: Team, answers: BoardAnswer[]): GameState {
  const all = range(answers.length);
  if (state.awarded.includes(state.round)) return { ...state, revealed: all };
  const value = potValue(state, answers) * multiplier(state.round);
  const scores = team === "w" ? { scoreW: state.scoreW + value } : { scoreH: state.scoreH + value };
  return { ...state, ...scores, awarded: [...state.awarded, state.round], revealed: all };
}

function finalPick(state: GameState, person: Person, question: number, answer: number): GameState {
  assert(question >= 0 && question < FINAL_COUNT, "finalPick: question index out of range");
  const other = person === "p1" ? state.final.p2 : state.final.p1;
  // Osoba 2 nie może powtórzyć odpowiedzi osoby 1.
  if (person === "p2" && answer !== NONE && state.final.p1[question] === answer) return state;
  const column = state.final[person].map((v, i) => (i === question ? answer : v));
  // Jeśli osoba 1 zmieni wybór na ten, który ma osoba 2 – osobie 2 czyścimy pole.
  const cleared = person === "p1" && answer !== NONE && other[question] === answer
    ? other.map((v, i) => (i === question ? NONE : v))
    : other;
  const final = person === "p1" ? { p1: column, p2: cleared } : { p1: cleared, p2: column };
  return { ...state, final };
}

function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "reveal": return reveal(state, action.index, action.slotCount);
    case "revealAll": return { ...state, revealed: range(action.slotCount) };
    case "strike": return { ...state, strikes: Math.min(MAX_STRIKES, state.strikes + 1) };
    case "award": return award(state, action.team, action.answers);
    case "next": return freshRound(state, Math.min(ROUND_COUNT, state.round + 1));
    case "setRound": return freshRound(state, Math.min(ROUND_COUNT, Math.max(1, action.round)));
    case "setView": return { ...state, view: action.view };
    case "reset": return { ...initialGameState(), view: state.view, final: state.final };
    case "finalPick": return finalPick(state, action.person, action.question, action.answer);
    case "finalClear": return { ...state, final: initialGameState().final, timerEndsAt: null };
    case "timerStart": return { ...state, timerEndsAt: action.now + action.seconds * 1000 };
    case "timerStop": return { ...state, timerEndsAt: null };
  }
}

/** Czysty reducer gry. Każda zmiana podbija `rev`. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  const next = applyAction(state, action);
  if (next === state) return state;
  assert(next.revealed.length <= BOARD_SLOTS, "gameReducer: too many revealed slots");
  assert(next.strikes <= MAX_STRIKES, "gameReducer: too many strikes");
  return { ...next, rev: state.rev + 1 };
}

/** Suma punktów finału obu osób. */
export function finalTotal(state: GameState, finalAnswers: BoardAnswer[][]): number {
  const pts = (col: number[]) =>
    col.reduce((sum, a, k) => sum + (a === NONE ? 0 : (finalAnswers[k]?.[a]?.points ?? 0)), 0);
  return pts(state.final.p1) + pts(state.final.p2);
}

/** Bezpieczne odtworzenie stanu z bazy: brakujące lub błędne pola zastępowane domyślnymi. */
export function parseGameState(raw: unknown): GameState {
  const base = initialGameState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<GameState>;
  const nums = (v: unknown, len: number) =>
    Array.isArray(v) && v.length === len && v.every((x) => Number.isInteger(x)) ? (v as number[]) : null;
  return {
    rev: Number.isInteger(r.rev) ? r.rev! : 0,
    view: r.view === "final" ? "final" : "game",
    round: Number.isInteger(r.round) && r.round! >= 1 && r.round! <= ROUND_COUNT ? r.round! : 1,
    revealed: Array.isArray(r.revealed) ? r.revealed.filter((x) => Number.isInteger(x)).slice(0, BOARD_SLOTS) : [],
    strikes: Number.isInteger(r.strikes) ? Math.min(MAX_STRIKES, Math.max(0, r.strikes!)) : 0,
    scoreW: Number.isFinite(r.scoreW) ? r.scoreW! : 0,
    scoreH: Number.isFinite(r.scoreH) ? r.scoreH! : 0,
    awarded: Array.isArray(r.awarded) ? r.awarded.filter((x) => Number.isInteger(x)) : [],
    final: {
      p1: nums(r.final?.p1, FINAL_COUNT) ?? base.final.p1,
      p2: nums(r.final?.p2, FINAL_COUNT) ?? base.final.p2,
    },
    timerEndsAt: Number.isFinite(r.timerEndsAt) ? r.timerEndsAt! : null,
  };
}

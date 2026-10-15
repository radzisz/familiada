import { assert } from "./assert";
import { BOARD_SLOTS, FINAL_COUNT, ROUND_COUNT, type BoardAnswer } from "./types";

export const MULTIPLIER: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 3 };
export const MAX_STRIKES = 3;
export const FINAL_TARGET = 200;
export const NONE = -1;
/** Ile sekund odliczamy na tablicy po pokazaniu pytania (potem sygnał „piii”). */
export const QUESTION_COUNTDOWN_S = 5;
/** Ile ostatnich kroków można cofnąć przyciskiem „Wstecz”. */
export const MAX_HISTORY = 30;

export type Team = "w" | "h";
export type Person = "p1" | "p2";

export interface GameState {
  /** Rośnie przy każdej zmianie; wyższy numer wygrywa przy synchronizacji urządzeń. */
  rev: number;
  view: "game" | "final";
  round: number;
  /** Czy pytanie bieżącej rundy jest już pokazane na tablicy (pierwsze „Dalej” w rundzie je odsłania). */
  questionShown: boolean;
  /** Koniec odliczania po pokazaniu pytania (ms od epoki); null = brak odliczania. */
  questionEndsAt: number | null;
  /** Odpowiedzi odkryte w trakcie gry – tylko one liczą się do puli. */
  revealed: number[];
  /** Odpowiedzi pokazane na koniec („Odkryj resztę”) – widoczne, ale bez punktów. */
  uncovered: number[];
  strikes: number;
  scoreW: number;
  scoreH: number;
  /** Drużyna, która teraz odpowiada – do niej trafi pula rundy (null = jeszcze nie wybrana). */
  turn: Team | null;
  /** Rundy, w których pula została już przyznana. */
  awarded: number[];
  final: { p1: number[]; p2: number[] };
  timerEndsAt: number | null;
  /** Poprzednie stany (najstarszy pierwszy) – „Wstecz” cofa ostatnią akcję. */
  history: GameSnapshot[];
}

/** Stan gry bez numeru wersji i bez historii – jeden krok do cofnięcia. */
export type GameSnapshot = Omit<GameState, "rev" | "history">;

export type GameAction =
  | { type: "reveal"; index: number; slotCount: number }
  | { type: "revealAll"; answers: BoardAnswer[] }
  | { type: "setTurn"; team: Team }
  | { type: "conceal"; index: number }
  | { type: "strike" }
  | { type: "award"; team: Team; answers: BoardAnswer[] }
  | { type: "next"; answers: BoardAnswer[]; now: number }
  | { type: "setRound"; round: number }
  | { type: "setView"; view: GameState["view"] }
  | { type: "reset" }
  | { type: "finalPick"; person: Person; question: number; answer: number }
  | { type: "finalClear" }
  | { type: "timerStart"; seconds: number; now: number }
  | { type: "timerStop" }
  | { type: "undo" };

export function initialGameState(): GameState {
  return {
    rev: 0,
    view: "game",
    round: 1,
    questionShown: false,
    questionEndsAt: null,
    revealed: [],
    uncovered: [],
    strikes: 0,
    scoreW: 0,
    scoreH: 0,
    turn: null,
    awarded: [],
    final: { p1: Array(FINAL_COUNT).fill(NONE), p2: Array(FINAL_COUNT).fill(NONE) },
    timerEndsAt: null,
    history: [],
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
  return { ...state, round, questionShown: false, questionEndsAt: null, revealed: [], uncovered: [], strikes: 0, turn: null };
}

/** Przyznaje pulę drużynie, która odpowiada (jeśli jest wybrana i pula jeszcze nie przyznana). */
function awardToTurn(state: GameState, answers: BoardAnswer[]): GameState {
  if (!state.turn || state.awarded.includes(state.round)) return state;
  return award(state, state.turn, answers);
}

/** „Odkryj resztę”: pokazuje brakujące odpowiedzi bez punktów – pula dalej liczy tylko odkryte w grze. */
function revealRest(state: GameState, answers: BoardAnswer[]): GameState {
  const rest = range(answers.length).filter((i) => !state.revealed.includes(i));
  return { ...state, uncovered: rest };
}

/** Czy odpowiedź jest widoczna na tablicy (odkryta w grze albo pokazana na koniec). */
export function isShown(state: GameState, index: number): boolean {
  return state.revealed.includes(index) || state.uncovered.includes(index);
}

export type NextStep = "question" | "round" | "final";

/** Co zrobi „Dalej”: pokaże pytanie, przejdzie do kolejnego pytania albo do finału (null = w finale nic). */
export function nextStep(state: GameState): NextStep | null {
  if (state.view === "final") return null;
  if (!state.questionShown) return "question";
  return state.round >= ROUND_COUNT ? "final" : "round";
}

/** „Dalej”: najpierw odsłania pytanie; potem przyznaje nieprzyznaną pulę i idzie do kolejnej rundy albo finału. */
function next(state: GameState, answers: BoardAnswer[], now: number): GameState {
  const step = nextStep(state);
  if (step === null) return state;
  if (step === "question") return { ...state, questionShown: true, questionEndsAt: now + QUESTION_COUNTDOWN_S * 1000 };
  const done = awardToTurn(state, answers);
  if (state.round >= ROUND_COUNT) return { ...done, view: "final" };
  return freshRound(done, state.round + 1);
}

function reveal(state: GameState, index: number, slotCount: number): GameState {
  // Odpowiedź już widoczna (także pokazana przez „Odkryj resztę”) nie trafia drugi raz – i nie wchodzi do puli.
  if (index < 0 || index >= slotCount || isShown(state, index)) return state;
  return { ...state, revealed: [...state.revealed, index] };
}

/** Chowa odkrytą odpowiedź z tablicy (np. odkrytą przez pomyłkę). */
function conceal(state: GameState, index: number): GameState {
  if (!isShown(state, index)) return state;
  return { ...state, revealed: state.revealed.filter((i) => i !== index), uncovered: state.uncovered.filter((i) => i !== index) };
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
    case "revealAll": return revealRest(state, action.answers);
    case "setTurn": return state.turn === action.team ? state : { ...state, turn: action.team };
    case "conceal": return conceal(state, action.index);
    case "strike": return { ...state, strikes: Math.min(MAX_STRIKES, state.strikes + 1) };
    case "award": return award(state, action.team, action.answers);
    case "next": return next(state, action.answers, action.now);
    case "setRound": return freshRound(state, Math.min(ROUND_COUNT, Math.max(1, action.round)));
    case "setView": return { ...state, view: action.view };
    case "reset": return { ...initialGameState(), view: state.view, final: state.final };
    case "finalPick": return finalPick(state, action.person, action.question, action.answer);
    case "finalClear": return { ...state, final: initialGameState().final, timerEndsAt: null };
    case "timerStart": return { ...state, timerEndsAt: action.now + action.seconds * 1000 };
    case "timerStop": return { ...state, timerEndsAt: null };
    case "undo": return undo(state);
  }
}

// Stoper nie jest „akcją do cofnięcia” – cofanie nie zatrzymuje ani nie wznawia odliczania.
const UNRECORDED = new Set<GameAction["type"]>(["timerStart", "timerStop", "undo"]);

function snapshot(state: GameState): GameSnapshot {
  const copy: Partial<GameState> = { ...state };
  delete copy.rev;
  delete copy.history;
  return copy as GameSnapshot;
}

/** Przywraca stan sprzed ostatniej akcji (stoper zostaje taki, jak jest). */
function undo(state: GameState): GameState {
  const previous = state.history[state.history.length - 1];
  if (!previous) return state;
  return { ...previous, timerEndsAt: state.timerEndsAt, rev: state.rev, history: state.history.slice(0, -1) };
}

/** Czysty reducer gry. Każda zmiana podbija `rev`; akcje (poza stoperem) trafiają do historii. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  const next = applyAction(state, action);
  if (next === state) return state;
  assert(next.revealed.length <= BOARD_SLOTS, "gameReducer: too many revealed slots");
  assert(next.strikes <= MAX_STRIKES, "gameReducer: too many strikes");
  const history = UNRECORDED.has(action.type) ? next.history : [...state.history, snapshot(state)].slice(-MAX_HISTORY);
  assert(history.length <= MAX_HISTORY, "gameReducer: history too long");
  return { ...next, history, rev: state.rev + 1 };
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
    // Zapis sprzed tej flagi to gra w toku – pytanie było już na tablicy.
    questionShown: typeof r.questionShown === "boolean" ? r.questionShown : true,
    questionEndsAt: Number.isFinite(r.questionEndsAt) ? r.questionEndsAt! : null,
    revealed: Array.isArray(r.revealed) ? r.revealed.filter((x) => Number.isInteger(x)).slice(0, BOARD_SLOTS) : [],
    uncovered: Array.isArray(r.uncovered) ? r.uncovered.filter((x) => Number.isInteger(x)).slice(0, BOARD_SLOTS) : [],
    strikes: Number.isInteger(r.strikes) ? Math.min(MAX_STRIKES, Math.max(0, r.strikes!)) : 0,
    scoreW: Number.isFinite(r.scoreW) ? r.scoreW! : 0,
    scoreH: Number.isFinite(r.scoreH) ? r.scoreH! : 0,
    turn: r.turn === "w" || r.turn === "h" ? r.turn : null,
    awarded: Array.isArray(r.awarded) ? r.awarded.filter((x) => Number.isInteger(x)) : [],
    final: {
      p1: nums(r.final?.p1, FINAL_COUNT) ?? base.final.p1,
      p2: nums(r.final?.p2, FINAL_COUNT) ?? base.final.p2,
    },
    timerEndsAt: Number.isFinite(r.timerEndsAt) ? r.timerEndsAt! : null,
    history: parseHistory(r.history),
  };
}

/** Historia z bazy: tylko obiekty, najwyżej MAX_HISTORY, każdy krok sprawdzony jak stan (bez zagnieżdżonej historii). */
function parseHistory(raw: unknown): GameSnapshot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_HISTORY)
    .filter((h): h is object => h !== null && typeof h === "object")
    .map((h) => snapshot(parseGameState({ ...h, history: [] })));
}

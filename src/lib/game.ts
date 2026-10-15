import { assert } from "./assert";
import { BOARD_SLOTS, FINAL_COUNT, ROUND_COUNT, type BoardAnswer } from "./types";

export const MULTIPLIER: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 3 };
export const MAX_STRIKES = 3;
export const FINAL_TARGET = 200;
export const NONE = -1;
/** Finał: gracz odpowiedział, ale odpowiedzi nie ma na tablicy – 0 punktów, na tablicy „✗”. */
export const WRONG = -2;
/** Ile sekund odliczamy na tablicy po pokazaniu pytania (potem sygnał „piii”). */
export const QUESTION_COUNTDOWN_S = 3;
/** Ile ostatnich kroków można cofnąć przyciskiem „Wstecz”. */
export const MAX_HISTORY = 30;

export type Team = "w" | "h";
export type Person = "p1" | "p2";

export interface GameState {
  /** Rośnie przy każdej zmianie; wyższy numer wygrywa przy synchronizacji urządzeń. */
  rev: number;
  /** „thanks” – ekran końcowy z logami organizatorów po finale. */
  view: "game" | "final" | "thanks";
  round: number;
  /** Czy pytanie bieżącej rundy jest już pokazane na tablicy (pierwsze „Dalej” w rundzie je odsłania). */
  questionShown: boolean;
  /** Koniec odliczania po pokazaniu pytania (ms od epoki); null = brak odliczania. */
  questionEndsAt: number | null;
  /** Odpowiedzi odkryte w trakcie gry – tylko one liczą się do puli. */
  revealed: number[];
  /** Odpowiedzi pokazane na koniec rundy („Pokaż kolejną”, od dołu) – widoczne, ale bez punktów. */
  uncovered: number[];
  /** Błędy (X) w bieżącej rundzie osobno dla każdej drużyny – pokazywane po jej stronie tablicy. */
  strikes: Record<Team, number>;
  scoreW: number;
  scoreH: number;
  /** Drużyna, która teraz odpowiada – do niej trafi pula rundy (null = jeszcze nie wybrana). */
  turn: Team | null;
  /** Rundy, w których pula została już przyznana. */
  awarded: number[];
  final: { p1: number[]; p2: number[] };
  timerEndsAt: number | null;
  /** Krok finału sterowany „Dalej” (0–FINAL_DONE): osoba 1 gotowa / odpowiada, osoba 2 gotowa / odpowiada, koniec. */
  finalStep: number;
  /** Pytanie finału pokazane teraz na tablicy (NONE = żadne). */
  finalQuestion: number;
  /** Poprzednie stany (najstarszy pierwszy) – „Wstecz” cofa ostatnią akcję. */
  history: GameSnapshot[];
}

/** Stan gry bez numeru wersji i bez historii – jeden krok do cofnięcia. */
export type GameSnapshot = Omit<GameState, "rev" | "history">;

export type GameAction =
  | { type: "reveal"; index: number; slotCount: number }
  | { type: "uncoverNext"; slotCount: number }
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
  | { type: "finalNext"; now: number }
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
    strikes: { w: 0, h: 0 },
    scoreW: 0,
    scoreH: 0,
    turn: null,
    awarded: [],
    final: { p1: Array(FINAL_COUNT).fill(NONE), p2: Array(FINAL_COUNT).fill(NONE) },
    timerEndsAt: null,
    finalStep: 0,
    finalQuestion: NONE,
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
  return { ...state, round, questionShown: false, questionEndsAt: null, revealed: [], uncovered: [], strikes: { w: 0, h: 0 }, turn: null };
}

/** Przyznaje pulę drużynie, która odpowiada (jeśli jest wybrana i pula jeszcze nie przyznana). */
function awardToTurn(state: GameState, answers: BoardAnswer[]): GameState {
  if (!state.turn || state.awarded.includes(state.round)) return state;
  return award(state, state.turn, answers);
}

/**
 * „Pokaż kolejną”: jak w programie – po rundzie odsłania jedną nieodkrytą odpowiedź, zaczynając od dołu tablicy.
 * Nikt nie dostaje za nią punktów i nie wchodzi do puli.
 */
function uncoverNext(state: GameState, slotCount: number): GameState {
  assert(Number.isInteger(slotCount) && slotCount >= 0 && slotCount <= BOARD_SLOTS, "uncoverNext: slotCount out of range");
  const next = range(slotCount).reverse().find((i) => !isShown(state, i));
  if (next === undefined) return state;
  return { ...state, uncovered: [...state.uncovered, next] };
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

/** Trafiona odpowiedź – liczy się do puli, więc musi być wybrana drużyna, która odpowiada. */
function reveal(state: GameState, index: number, slotCount: number): GameState {
  if (!state.turn) return state;
  // Odpowiedź już widoczna (także pokazana przez „Pokaż kolejną”) nie trafia drugi raz – i nie wchodzi do puli.
  if (index < 0 || index >= slotCount || isShown(state, index)) return state;
  return { ...state, revealed: [...state.revealed, index] };
}

/** Chowa odkrytą odpowiedź z tablicy (np. odkrytą przez pomyłkę). */
function conceal(state: GameState, index: number): GameState {
  if (!isShown(state, index)) return state;
  return { ...state, revealed: state.revealed.filter((i) => i !== index), uncovered: state.uncovered.filter((i) => i !== index) };
}

/** Pula dla drużyny; nieodkryte odpowiedzi zostają zakryte – pokazuje się je potem „Pokaż kolejną”. */
function award(state: GameState, team: Team, answers: BoardAnswer[]): GameState {
  if (state.awarded.includes(state.round)) return state;
  const value = potValue(state, answers) * multiplier(state.round);
  const scores = team === "w" ? { scoreW: state.scoreW + value } : { scoreH: state.scoreH + value };
  return { ...state, ...scores, awarded: [...state.awarded, state.round] };
}

/** Czas na odpowiedzi w finale (sekundy): osoba 1 i osoba 2. */
export const FINAL_SECONDS: Record<Person, number> = { p1: 20, p2: 25 };
/** Kroki finału: 0 osoba 1 gotowa, 1 osoba 1 odpowiada (stoper), 2 osoba 2 gotowa, 3 osoba 2 odpowiada, 4 koniec. */
export const FINAL_DONE = 4;

/** Kto teraz odpowiada w finale (wynika z kroku). */
export function finalPerson(state: GameState): Person {
  return state.finalStep < 2 ? "p1" : "p2";
}

const answering = (state: GameState) => state.finalStep === 1 || state.finalStep === 3;
const timeIsUp = (state: GameState, now: number) => state.timerEndsAt === null || now >= state.timerEndsAt;

/** Które pytanie finału widać teraz na tablicy (null = żadne: przed startem albo po upływie czasu). */
export function finalQuestionOnBoard(state: GameState, now: number): number | null {
  if (!answering(state) || state.finalQuestion < 0 || timeIsUp(state, now)) return null;
  return state.finalQuestion;
}

/** Dopisek pod „Dalej” w finale: co zrobi następne kliknięcie (null = finał skończony). */
export function finalNextHint(state: GameState, now: number): string | null {
  if (state.view === "thanks") return null;
  if (state.finalStep >= FINAL_DONE) return "podziękowanie";
  if (state.finalStep === 0) return `start ${FINAL_SECONDS.p1} s · pytanie 1`;
  if (state.finalStep === 2) return `start ${FINAL_SECONDS.p2} s · pytanie 1`;
  if (!answering(state)) return null;
  const last = state.finalQuestion >= FINAL_COUNT - 1 || timeIsUp(state, now);
  if (last) return state.finalStep === 1 ? "osoba 2" : "koniec finału";
  return `pytanie ${state.finalQuestion + 2}`;
}

/**
 * „Dalej” w finale: start stopera z pierwszym pytaniem na tablicy, potem kolejne pytania;
 * po ostatnim pytaniu albo po upływie czasu – następna osoba (pytania znikają) i na końcu koniec finału.
 */
function finalNext(state: GameState, now: number): GameState {
  if (state.view === "thanks") return state;
  // Po zakończonym finale „Dalej” pokazuje ekran końcowy z podziękowaniem.
  if (state.finalStep >= FINAL_DONE) return { ...state, view: "thanks" };
  if (state.finalStep === 0 || state.finalStep === 2) {
    const seconds = state.finalStep === 0 ? FINAL_SECONDS.p1 : FINAL_SECONDS.p2;
    return { ...state, finalStep: state.finalStep + 1, finalQuestion: 0, timerEndsAt: now + seconds * 1000 };
  }
  if (state.finalQuestion < FINAL_COUNT - 1 && !timeIsUp(state, now)) return { ...state, finalQuestion: state.finalQuestion + 1 };
  return { ...state, finalStep: state.finalStep + 1, finalQuestion: NONE, timerEndsAt: null };
}

/** Błąd (X) dla drużyny, która teraz odpowiada (najwyżej MAX_STRIKES); bez wybranej drużyny nic się nie dzieje. */
function strike(state: GameState): GameState {
  if (!state.turn || state.strikes[state.turn] >= MAX_STRIKES) return state;
  return { ...state, strikes: { ...state.strikes, [state.turn]: state.strikes[state.turn] + 1 } };
}

function finalPick(state: GameState, person: Person, question: number, answer: number): GameState {
  assert(question >= 0 && question < FINAL_COUNT, "finalPick: question index out of range");
  assert(Number.isInteger(answer) && answer >= WRONG, "finalPick: bad answer index");
  const other = person === "p1" ? state.final.p2 : state.final.p1;
  // Osoba 2 nie może powtórzyć odpowiedzi osoby 1.
  // Błędna odpowiedź (WRONG) i „brak” (NONE) mogą się powtarzać – blokujemy tylko odpowiedzi z tablicy.
  if (person === "p2" && answer >= 0 && state.final.p1[question] === answer) return state;
  const column = state.final[person].map((v, i) => (i === question ? answer : v));
  // Jeśli osoba 1 zmieni wybór na ten, który ma osoba 2 – osobie 2 czyścimy pole.
  const cleared = person === "p1" && answer >= 0 && other[question] === answer
    ? other.map((v, i) => (i === question ? NONE : v))
    : other;
  const final = person === "p1" ? { p1: column, p2: cleared } : { p1: cleared, p2: column };
  return { ...state, final };
}

function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "reveal": return reveal(state, action.index, action.slotCount);
    case "uncoverNext": return uncoverNext(state, action.slotCount);
    case "setTurn": return state.turn === action.team ? state : { ...state, turn: action.team };
    case "conceal": return conceal(state, action.index);
    case "strike": return strike(state);
    case "award": return award(state, action.team, action.answers);
    case "next": return next(state, action.answers, action.now);
    case "setRound": return freshRound(state, Math.min(ROUND_COUNT, Math.max(1, action.round)));
    case "setView": return { ...state, view: action.view };
    case "reset": return { ...initialGameState(), view: state.view, final: state.final };
    case "finalPick": return finalPick(state, action.person, action.question, action.answer);
    case "finalClear": return { ...state, final: initialGameState().final, timerEndsAt: null, finalStep: 0, finalQuestion: NONE };
    case "finalNext": return finalNext(state, action.now);
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
  assert(next.strikes.w <= MAX_STRIKES && next.strikes.h <= MAX_STRIKES, "gameReducer: too many strikes");
  const history = UNRECORDED.has(action.type) ? next.history : [...state.history, snapshot(state)].slice(-MAX_HISTORY);
  assert(history.length <= MAX_HISTORY, "gameReducer: history too long");
  return { ...next, history, rev: state.rev + 1 };
}

/** Suma punktów finału obu osób. */
export function finalTotal(state: GameState, finalAnswers: BoardAnswer[][]): number {
  const pts = (col: number[]) =>
    col.reduce((sum, a, k) => sum + (a < 0 ? 0 : (finalAnswers[k]?.[a]?.points ?? 0)), 0);
  return pts(state.final.p1) + pts(state.final.p2);
}

/** Liczba błędów drużyny z zapisu w bazie (stary zapis – jedna liczba – traktujemy jak brak błędów). */
function strikeCount(raw: unknown, team: Team): number {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>)[team] : undefined;
  return typeof v === "number" && Number.isInteger(v) ? Math.min(MAX_STRIKES, Math.max(0, v)) : 0;
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
    view: r.view === "final" || r.view === "thanks" ? r.view : "game",
    round: Number.isInteger(r.round) && r.round! >= 1 && r.round! <= ROUND_COUNT ? r.round! : 1,
    // Zapis sprzed tej flagi to gra w toku – pytanie było już na tablicy.
    questionShown: typeof r.questionShown === "boolean" ? r.questionShown : true,
    questionEndsAt: Number.isFinite(r.questionEndsAt) ? r.questionEndsAt! : null,
    revealed: Array.isArray(r.revealed) ? r.revealed.filter((x) => Number.isInteger(x)).slice(0, BOARD_SLOTS) : [],
    uncovered: Array.isArray(r.uncovered) ? r.uncovered.filter((x) => Number.isInteger(x)).slice(0, BOARD_SLOTS) : [],
    strikes: { w: strikeCount(r.strikes, "w"), h: strikeCount(r.strikes, "h") },
    scoreW: Number.isFinite(r.scoreW) ? r.scoreW! : 0,
    scoreH: Number.isFinite(r.scoreH) ? r.scoreH! : 0,
    turn: r.turn === "w" || r.turn === "h" ? r.turn : null,
    awarded: Array.isArray(r.awarded) ? r.awarded.filter((x) => Number.isInteger(x)) : [],
    final: {
      p1: nums(r.final?.p1, FINAL_COUNT) ?? base.final.p1,
      p2: nums(r.final?.p2, FINAL_COUNT) ?? base.final.p2,
    },
    timerEndsAt: Number.isFinite(r.timerEndsAt) ? r.timerEndsAt! : null,
    finalStep: Number.isInteger(r.finalStep) && r.finalStep! >= 0 && r.finalStep! <= FINAL_DONE ? r.finalStep! : 0,
    finalQuestion: Number.isInteger(r.finalQuestion) && r.finalQuestion! >= 0 && r.finalQuestion! < FINAL_COUNT ? r.finalQuestion! : NONE,
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

import { assert } from "./assert";
import { BOARD_SLOTS, FINAL_COUNT, ROUND_COUNT, type Audience, type BoardAnswer, type GamePlan } from "./types";

/** Pytanie z policzonym wynikiem (tak jak będzie na tablicy). */
export interface PlanCandidate {
  id: string;
  audience: Audience;
  position: number;
  respondents: number;
  board: BoardAnswer[];
}

export type AutoPlanMode = "fill" | "all";

const MIN_RESPONDENTS = 3;
/** Przy tylu odpowiedziach wynik pytania uznajemy za w pełni wiarygodny. */
const CONFIDENT_RESPONDENTS = 10;
/** Docelowa grupa pytania w rundach 1–5 (runda 2: mężowie o żonach, runda 3: żony o mężach). */
const ROUND_AUDIENCE: readonly Audience[] = ["all", "husband", "wife", "all", "all"];
/** Kolejność obsadzania rund: najpierw te z wymaganą grupą, potem ×3, ×2, ×1. */
const ROUND_FILL_ORDER = [1, 2, 4, 3, 0] as const;

const confidence = (c: PlanCandidate) => Math.min(1, c.respondents / CONFIDENT_RESPONDENTS);
const totalPoints = (c: PlanCandidate) => c.board.reduce((sum, a) => sum + a.points, 0);

/** Dobra runda: pełna tablica (6 odpowiedzi), które razem pokrywają dużą część odpowiedzi. */
export function roundScore(c: PlanCandidate): number {
  if (c.respondents < MIN_RESPONDENTS || c.board.length < 3) return 0;
  const fill = c.board.length / BOARD_SLOTS;
  const coverage = Math.min(1, totalPoints(c) / 100);
  return fill * coverage * confidence(c);
}

/** Dobre pytanie finałowe: wyraźny lider (dużo punktów za pierwszą odpowiedź). */
export function finalScore(c: PlanCandidate): number {
  if (c.respondents < MIN_RESPONDENTS || c.board.length < 2) return 0;
  return ((c.board[0]?.points ?? 0) / 100) * confidence(c);
}

function bestUnused(
  cands: PlanCandidate[],
  used: Set<string>,
  score: (c: PlanCandidate) => number,
  audience: Audience | null,
): PlanCandidate | null {
  const ranked = cands
    .filter((c) => !used.has(c.id) && score(c) > 0 && (audience === null || c.audience === audience))
    .sort((a, b) => score(b) - score(a) || a.position - b.position);
  return ranked[0] ?? null;
}

function startingPlan(cands: PlanCandidate[], current: GamePlan, mode: AutoPlanMode): GamePlan {
  if (mode === "all") return { rounds: Array(ROUND_COUNT).fill(null), final: Array(FINAL_COUNT).fill(null) };
  const known = new Set(cands.map((c) => c.id));
  const keep = (id: string | null) => (id !== null && known.has(id) ? id : null);
  return { rounds: current.rounds.map(keep), final: current.final.map(keep) };
}

/**
 * Automatyczny wybór pytań do gry. `fill` uzupełnia tylko puste miejsca, `all` wybiera wszystko od nowa.
 * Rundy: pytania z pełną tablicą, z właściwą grupą (2: mężowie, 3: żony). Finał: wyraźny lider, najpierw pytania wspólne.
 */
export function autoPlan(cands: PlanCandidate[], current: GamePlan, mode: AutoPlanMode): GamePlan {
  assert(current.rounds.length === ROUND_COUNT && current.final.length === FINAL_COUNT, "autoPlan: bad plan shape");
  const plan = startingPlan(cands, current, mode);
  const used = new Set([...plan.rounds, ...plan.final].filter((id): id is string => id !== null));
  const take = (c: PlanCandidate | null): string | null => {
    if (c) used.add(c.id);
    return c?.id ?? null;
  };
  ROUND_FILL_ORDER.forEach((i) => {
    if (plan.rounds[i] !== null) return;
    const audience = ROUND_AUDIENCE[i] ?? null;
    plan.rounds[i] = take(bestUnused(cands, used, roundScore, audience) ?? bestUnused(cands, used, roundScore, null));
  });
  // W finale obie osoby odpowiadają na to samo pytanie, więc najpierw pytania wspólne.
  plan.final = plan.final.map(
    (id) => id ?? take(bestUnused(cands, used, finalScore, "all") ?? bestUnused(cands, used, finalScore, null)),
  );
  const ids = [...plan.rounds, ...plan.final].filter((id) => id !== null);
  assert(new Set(ids).size === ids.length, "autoPlan: question used twice");
  return plan;
}

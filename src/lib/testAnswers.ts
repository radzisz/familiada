import { assert } from "./assert";
import type { Audience, Role } from "./types";

/** Pojęcie w puli: [waga, wariant, wariant…] – warianty (literówki, synonimy) sprawdzają grupowanie. */
export type Concept = [number, ...string[]];
export type Pools = Record<string, Concept[]>;

export interface TestQuestion {
  id: string;
  audience: Audience;
  text: string;
}

export const ANSWER_RATE = 0.85;
export const MAX_TEST_SUBMISSIONS = 200;

/** Odczyt pul z JSON-a (pomija klucze opisowe i błędne wpisy). */
export function parsePools(raw: Record<string, unknown>): Pools {
  const pools: Pools = {};
  Object.entries(raw).forEach(([text, value]) => {
    if (!Array.isArray(value)) return;
    const concepts = value.filter(
      (c): c is Concept => Array.isArray(c) && typeof c[0] === "number" && c[0] > 0 && c.length > 1,
    );
    if (concepts.length > 0) pools[text] = concepts;
  });
  return pools;
}

/** Losuje wariant z puli proporcjonalnie do wag pojęć. `rng` zwraca liczby z [0, 1). */
export function pickAnswer(concepts: Concept[], rng: () => number): string {
  assert(concepts.length > 0, "pickAnswer: empty pool");
  const total = concepts.reduce((sum, c) => sum + c[0], 0);
  let r = rng() * total;
  const hit = concepts.find((c) => (r -= c[0]) < 0) ?? concepts[concepts.length - 1]!;
  const variants = hit.slice(1) as string[];
  return variants[Math.floor(rng() * variants.length)] ?? variants[0]!;
}

/** Odpowiedzi jednej testowej ankiety: pytania dla danej roli z pulą, ~85% wypełnionych. */
export function buildTestAnswers(questions: TestQuestion[], pools: Pools, role: Role, rng: () => number) {
  return questions
    .filter((q) => (q.audience === "all" || q.audience === role) && pools[q.text] !== undefined)
    .filter(() => rng() < ANSWER_RATE)
    .map((q) => ({ questionId: q.id, text: pickAnswer(pools[q.text]!, rng) }));
}

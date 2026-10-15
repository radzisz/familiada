/** Najwięcej kroków licznika – duże przyrosty liczą się co kilka punktów, żeby animacja trwała krótko. */
export const MAX_COUNT_STEPS = 30;

/**
 * Kolejne wartości, które pokazuje „nabijający się” licznik od `from` do `to` (bez `from`, z `to`).
 * Spadek (zerowanie, nowa runda) to jeden skok, a nie odliczanie w dół.
 */
export function countSteps(from: number, to: number, maxSteps = MAX_COUNT_STEPS): number[] {
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error(`countSteps: niepoprawne wartości ${from} → ${to}`);
  if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new Error(`countSteps: maxSteps=${maxSteps}`);
  if (from === to) return [];
  if (to < from) return [to];
  const count = Math.min(Math.ceil(to - from), maxSteps);
  const steps = Array.from({ length: count }, (_, i) => Math.round(from + ((to - from) * (i + 1)) / count));
  if (steps.at(-1) !== to) throw new Error(`countSteps: licznik nie kończy się na ${to}`);
  return steps;
}

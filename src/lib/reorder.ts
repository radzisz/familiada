import { assert } from "./assert";

/** Nowa kolejność po przeniesieniu elementu z pozycji `from` na `to` (bez zmiany wejścia). */
export function moveItem<T>(items: readonly T[], from: number, to: number): readonly T[] {
  const inRange = (i: number) => Number.isInteger(i) && i >= 0 && i < items.length;
  assert(inRange(from) && inRange(to), `moveItem: index out of range (${from} → ${to}, length ${items.length})`);
  if (from === to) return items;
  const rest = items.filter((_, i) => i !== from);
  const result = [...rest.slice(0, to), items[from]!, ...rest.slice(to)];
  assert(result.length === items.length, "moveItem: length changed");
  return result;
}

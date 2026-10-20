import { assert } from "./assert";
import { labelFromRaw, normalizeAnswer } from "./normalize";
import type { ScoringAnswer } from "./scoring";

export interface UniqueAnswer {
  normalized: string;
  count: number;
  sampleRaw: string;
}

export interface PlannedGroup {
  label: string;
  members: string[];
}

export interface BasicGroupingPlan {
  /** Odpowiedzi o tym `normalized` dołącz do istniejącej grupy. */
  attach: { normalized: string; groupId: string }[];
  /** Nowe grupy do utworzenia. */
  create: PlannedGroup[];
}

const MAX_LABEL = 60;

/** Unikalne odpowiedzi (po `normalized`) z licznością i najczęstszym zapisem, malejąco. */
export function uniqueAnswers(answers: ScoringAnswer[]): UniqueAnswer[] {
  const byNorm = new Map<string, Map<string, number>>();
  answers.forEach((a) => {
    const raws = byNorm.get(a.normalized) ?? new Map<string, number>();
    raws.set(a.raw, (raws.get(a.raw) ?? 0) + 1);
    byNorm.set(a.normalized, raws);
  });
  const result = [...byNorm.entries()].map(([normalized, raws]) => {
    const sorted = [...raws.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "pl"));
    const count = sorted.reduce((sum, [, n]) => sum + n, 0);
    return { normalized, count, sampleRaw: sorted[0]![0] };
  });
  return result.sort((a, b) => b.count - a.count || a.normalized.localeCompare(b.normalized, "pl"));
}

/**
 * Grupowanie bez AI: każda niepogrupowana odpowiedź trafia do grupy, w której jest już ta sama
 * odpowiedź (po `normalized`), a jeśli takiej nie ma – do nowej grupy.
 */
export function planBasicGrouping(answers: ScoringAnswer[]): BasicGroupingPlan {
  const homeOf = new Map<string, string>();
  answers.forEach((a) => {
    if (a.groupId && !homeOf.has(a.normalized)) homeOf.set(a.normalized, a.groupId);
  });
  const ungrouped = answers.filter((a) => a.groupId === null);
  const uniques = uniqueAnswers(ungrouped);
  const attach = uniques
    .filter((u) => homeOf.has(u.normalized))
    .map((u) => ({ normalized: u.normalized, groupId: homeOf.get(u.normalized)! }));
  const create = uniques
    .filter((u) => !homeOf.has(u.normalized))
    .map((u) => ({ label: clampLabel(labelFromRaw(u.sampleRaw)), members: [u.normalized] }));
  return { attach, create };
}

export function clampLabel(label: string): string {
  const trimmed = label.replace(/\s+/g, " ").trim().slice(0, MAX_LABEL);
  return trimmed === "" ? "?" : trimmed;
}

/**
 * Walidacja odpowiedzi AI: każdy `normalized` w dokładnie jednej grupie.
 * Nieznane i powtórzone pozycje są pomijane, brakujące trafiają do osobnych grup.
 * Grupy o tej samej etykiecie (po normalizacji) są scalane – inaczej na tablicy byłyby dwie takie same odpowiedzi.
 */
export function reconcileAiGroups(aiGroups: PlannedGroup[], uniques: UniqueAnswer[]): PlannedGroup[] {
  const known = new Map(uniques.map((u) => [u.normalized, u]));
  const assigned = new Set<string>();
  const fromAi = aiGroups.map((g) => {
    const members = [...new Set(g.members)].filter((m) => known.has(m) && !assigned.has(m));
    members.forEach((m) => assigned.add(m));
    return { label: clampLabel(labelFromRaw(g.label)), members };
  });
  const leftovers = uniques
    .filter((u) => !assigned.has(u.normalized))
    .map((u) => ({ label: clampLabel(labelFromRaw(u.sampleRaw)), members: [u.normalized] }));
  const result = mergeSameLabels([...fromAi.filter((g) => g.members.length > 0), ...leftovers]);
  const total = result.reduce((sum, g) => sum + g.members.length, 0);
  assert(total === uniques.length, "reconcileAiGroups: every answer in exactly one group");
  return result;
}

/** Scala grupy o tej samej etykiecie po normalizacji („Ubrania” i „ubrania!”); zostaje etykieta pierwszej. */
function mergeSameLabels(groups: PlannedGroup[]): PlannedGroup[] {
  const byLabel = new Map<string, PlannedGroup>();
  groups.forEach((g) => {
    const key = normalizeAnswer(g.label);
    const existing = byLabel.get(key);
    if (existing) existing.members.push(...g.members);
    else byLabel.set(key, { label: g.label, members: [...g.members] });
  });
  return [...byLabel.values()];
}

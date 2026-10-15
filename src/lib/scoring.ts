import { assert } from "./assert";
import { BOARD_SLOTS, type BoardAnswer } from "./types";

export interface ScoringAnswer {
  groupId: string | null;
  normalized: string;
  raw: string;
}

export interface ScoringGroup {
  id: string;
  label: string;
  hidden: boolean;
}

export interface GroupTally {
  key: string;
  label: string;
  count: number;
  points: number;
  hidden: boolean;
}

/** Odpowiedź bez grupy liczy się jako grupa wirtualna po `normalized`. */
export function groupKey(a: ScoringAnswer): string {
  return a.groupId ?? `n:${a.normalized}`;
}

function mostCommonRaw(answers: ScoringAnswer[]): string {
  const counts = new Map<string, number>();
  answers.forEach((a) => counts.set(a.raw, (counts.get(a.raw) ?? 0) + 1));
  const sorted = [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "pl"));
  return sorted[0]?.[0] ?? "";
}

/** Zlicza wszystkie grupy pytania (także ukryte), posortowane malejąco. */
export function tallyGroups(answers: ScoringAnswer[], groups: ScoringGroup[]): GroupTally[] {
  const byId = new Map(groups.map((g) => [g.id, g]));
  const buckets = new Map<string, ScoringAnswer[]>();
  answers.forEach((a) => {
    const key = groupKey(a);
    buckets.set(key, [...(buckets.get(key) ?? []), a]);
  });
  const respondents = answers.length;
  const tallies = [...buckets.entries()].map(([key, members]) => {
    const group = byId.get(key);
    return {
      key,
      label: group?.label ?? mostCommonRaw(members),
      count: members.length,
      points: Math.round((members.length / respondents) * 100),
      hidden: group?.hidden ?? false,
    };
  });
  return tallies.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pl"));
}

/** Top 6 widocznych grup; punkty = round(liczność / liczba odpowiadających × 100). */
export function boardAnswers(answers: ScoringAnswer[], groups: ScoringGroup[]): BoardAnswer[] {
  const top = tallyGroups(answers, groups)
    .filter((t) => !t.hidden)
    .slice(0, BOARD_SLOTS)
    .map((t) => ({ label: t.label, points: t.points }));
  assert(top.length <= BOARD_SLOTS, "boardAnswers: at most 6 answers");
  assert(top.every((t, i) => i === 0 || top[i - 1]!.points >= t.points), "boardAnswers: sorted descending");
  return top;
}

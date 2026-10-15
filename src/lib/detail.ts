import { uniqueAnswers, type UniqueAnswer } from "./grouping";
import { boardAnswers, groupKey, tallyGroups, type ScoringAnswer, type ScoringGroup } from "./scoring";
import type { BoardAnswer } from "./types";

export interface GroupDetail {
  id: string | null;
  label: string;
  hidden: boolean;
  count: number;
  points: number;
  members: UniqueAnswer[];
}

export interface QuestionDetail {
  respondents: number;
  ungrouped: number;
  groups: GroupDetail[];
  board: BoardAnswer[];
}

/** Widok grupowania jednego pytania: grupy z członkami, liczniki i podgląd tablicy. */
export function buildQuestionDetail(answers: ScoringAnswer[], groups: ScoringGroup[]): QuestionDetail {
  const ids = new Set(groups.map((g) => g.id));
  const tallies = tallyGroups(answers, groups);
  const details = tallies.map((t) => ({
    id: ids.has(t.key) ? t.key : null,
    label: t.label,
    hidden: t.hidden,
    count: t.count,
    points: t.points,
    members: uniqueAnswers(answers.filter((a) => groupKey(a) === t.key)),
  }));
  return {
    respondents: answers.length,
    ungrouped: answers.filter((a) => a.groupId === null).length,
    groups: details,
    board: boardAnswers(answers, groups),
  };
}

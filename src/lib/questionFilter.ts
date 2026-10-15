import { normalizeAnswer } from "./normalize";
import type { Audience } from "./types";

export interface QuestionFilter {
  /** null = wszyscy adresaci. */
  audience: Audience | null;
  /** Fragment treści; wielkość liter i ogonki bez znaczenia. */
  query: string;
}

export const NO_FILTER: QuestionFilter = { audience: null, query: "" };

/** Czy pytanie pasuje do szybkiego filtra nad listą pytań. */
export function matchesQuestion(q: { text: string; audience: Audience }, filter: QuestionFilter): boolean {
  if (filter.audience !== null && q.audience !== filter.audience) return false;
  const query = normalizeAnswer(filter.query);
  return query === "" || normalizeAnswer(q.text).includes(query);
}

export function isFiltering(filter: QuestionFilter): boolean {
  return filter.audience !== null || filter.query.trim() !== "";
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assert } from "@/lib/assert";
import type { Audience, Question } from "@/lib/types";
import { check } from "../db";

const COLUMNS = "id, position, audience, text, hidden";

export async function fetchQuestions(db: SupabaseClient, eventId: string): Promise<Question[]> {
  const { data, error } = await db.from("questions").select(COLUMNS).eq("event_id", eventId).order("position");
  check("fetchQuestions", error);
  return (data ?? []) as Question[];
}

export async function fetchQuestion(db: SupabaseClient, eventId: string, id: string): Promise<Question | null> {
  const { data, error } = await db.from("questions").select(COLUMNS).eq("event_id", eventId).eq("id", id).maybeSingle();
  check("fetchQuestion", error);
  return (data as Question | null) ?? null;
}

export interface QuestionStats {
  answers: number;
  ungrouped: number;
}

export async function fetchQuestionStats(db: SupabaseClient, eventId: string): Promise<Map<string, QuestionStats>> {
  const { data, error } = await db.rpc("question_stats", { p_event_id: eventId });
  check("fetchQuestionStats", error);
  const rows = (data ?? []) as { question_id: string; answer_count: number; ungrouped_count: number }[];
  return new Map(rows.map((r) => [r.question_id, { answers: Number(r.answer_count), ungrouped: Number(r.ungrouped_count) }]));
}

export async function insertQuestion(
  db: SupabaseClient,
  eventId: string,
  input: { audience: Audience; text: string },
): Promise<void> {
  const existing = await fetchQuestions(db, eventId);
  const position = existing.reduce((max, q) => Math.max(max, q.position), 0) + 1;
  const { error } = await db.from("questions").insert({ event_id: eventId, position, ...input });
  check("insertQuestion", error);
}

export async function updateQuestion(
  db: SupabaseClient,
  eventId: string,
  id: string,
  patch: Partial<Pick<Question, "audience" | "text" | "hidden">>,
): Promise<void> {
  assert(Object.keys(patch).length > 0, "updateQuestion: empty patch");
  const { error } = await db.from("questions").update(patch).eq("event_id", eventId).eq("id", id);
  check("updateQuestion", error);
}

/** Ustawia kolejność: pozycja = indeks w `orderedIds` + 1. Lista musi zawierać wszystkie pytania. */
export async function updateQuestionOrder(db: SupabaseClient, eventId: string, orderedIds: string[]): Promise<void> {
  const existing = await fetchQuestions(db, eventId);
  const known = new Set(existing.map((q) => q.id));
  assert(orderedIds.length === known.size && orderedIds.every((id) => known.has(id)), "updateQuestionOrder: id set mismatch");
  const results = await Promise.all(
    orderedIds.map((id, i) => db.from("questions").update({ position: i + 1 }).eq("event_id", eventId).eq("id", id)),
  );
  results.forEach((r) => check("updateQuestionOrder", r.error));
}

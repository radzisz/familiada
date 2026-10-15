import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assert } from "@/lib/assert";
import defaultQuestions from "@/lib/data/questions.json";
import { storedBoardTitle } from "@/lib/boardTitle";
import { isLogoSource, storedText, type CoOrganizer } from "@/lib/branding";
import { emptyPlan, type Audience } from "@/lib/types";
import { check } from "../db";
import { updateGamePlan } from "./events";
import { resetGameState } from "./game";

export interface EventSummary {
  id: string;
  name: string;
  isTest: boolean;
  surveyOpen: boolean;
  createdAt: string;
  submissions: number;
  questions: number;
}

type EventListRow = { id: string; name: string; is_test: boolean; survey_open: boolean; created_at: string };
type SummaryRow = { event_id: string; submission_count: number; question_count: number };

/** Wszystkie rozgrywki (najnowsze najpierw) z liczbą ankiet i pytań. */
export async function fetchEventSummaries(db: SupabaseClient): Promise<EventSummary[]> {
  const [events, counts] = await Promise.all([
    db.from("events").select("id, name, is_test, survey_open, created_at").order("created_at", { ascending: false }),
    db.rpc("event_summaries"),
  ]);
  check("fetchEventSummaries", events.error ?? counts.error);
  const byId = new Map(((counts.data ?? []) as SummaryRow[]).map((c) => [c.event_id, c]));
  return ((events.data ?? []) as EventListRow[]).map((e) => ({
    id: e.id,
    name: e.name,
    isTest: e.is_test,
    surveyOpen: e.survey_open,
    createdAt: e.created_at,
    submissions: Number(byId.get(e.id)?.submission_count ?? 0),
    questions: Number(byId.get(e.id)?.question_count ?? 0),
  }));
}

/** Tworzy rozgrywkę; zwraca jej id. */
export async function insertEvent(db: SupabaseClient, input: { name: string; isTest: boolean }): Promise<string> {
  const { data, error } = await db
    .from("events")
    .insert({ name: input.name, is_test: input.isTest })
    .select("id")
    .single();
  check("insertEvent", error);
  return (data as { id: string }).id;
}

type QuestionSeed = { position: number; audience: Audience; text: string; hidden: boolean };

async function insertQuestionRows(db: SupabaseClient, eventId: string, rows: QuestionSeed[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await db.from("questions").insert(rows.map((r) => ({ ...r, event_id: eventId })));
  check("insertQuestionRows", error);
}

/** 26 domyślnych pytań z `src/lib/data/questions.json`. */
export async function insertDefaultQuestions(db: SupabaseClient, eventId: string): Promise<void> {
  const rows = defaultQuestions.map((q, i) => ({ position: i + 1, audience: q.audience as Audience, text: q.text, hidden: false }));
  await insertQuestionRows(db, eventId, rows);
}

/** Kopiuje pytania innej rozgrywki (bez odpowiedzi i grup). */
export async function copyQuestions(db: SupabaseClient, fromEventId: string, toEventId: string): Promise<void> {
  const { data, error } = await db
    .from("questions")
    .select("position, audience, text, hidden")
    .eq("event_id", fromEventId)
    .order("position");
  check("copyQuestions", error);
  await insertQuestionRows(db, toEventId, (data ?? []) as QuestionSeed[]);
}

export interface EventPatch {
  name?: string;
  isTest?: boolean;
  boardTitle?: string;
  eventName?: string;
  /** null usuwa współorganizatora. */
  coOrganizer?: CoOrganizer | null;
}

function coOrganizerColumns(co: CoOrganizer | null) {
  assert(co === null || isLogoSource(co.logo), "coOrganizerColumns: logo source");
  return { partner_name: co?.name ?? null, partner_url: co?.url ?? null, partner_logo: co?.logo ?? null };
}

export async function updateEvent(
  db: SupabaseClient,
  eventId: string,
  patch: EventPatch,
): Promise<void> {
  const row = {
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.isTest !== undefined && { is_test: patch.isTest }),
    ...(patch.boardTitle !== undefined && { board_title: storedBoardTitle(patch.boardTitle) }),
    ...(patch.eventName !== undefined && { event_name: storedText(patch.eventName) }),
    ...(patch.coOrganizer !== undefined && coOrganizerColumns(patch.coOrganizer)),
  };
  assert(Object.keys(row).length > 0, "updateEvent: empty patch");
  const { error } = await db.from("events").update(row).eq("id", eventId);
  check("updateEvent", error);
}

/** Usuwa rozgrywkę razem z pytaniami, ankietami i stanem gry (kaskada w bazie). */
export async function deleteEvent(db: SupabaseClient, eventId: string): Promise<boolean> {
  const { data, error } = await db.from("events").delete().eq("id", eventId).select("id");
  check("deleteEvent", error);
  return (data ?? []).length === 1;
}

/** Usuwa ankiety (z odpowiedziami – kaskada) i grupy odpowiedzi; zwraca liczbę usuniętych ankiet. */
export async function deleteEventAnswers(db: SupabaseClient, eventId: string): Promise<number> {
  const { data: questions, error: qErr } = await db.from("questions").select("id").eq("event_id", eventId);
  check("deleteEventAnswers.questions", qErr);
  const ids = ((questions ?? []) as { id: string }[]).map((q) => q.id);
  const { data, error } = await db.from("submissions").delete().eq("event_id", eventId).select("id");
  check("deleteEventAnswers.submissions", error);
  if (ids.length > 0) {
    const { error: gErr } = await db.from("answer_groups").delete().in("question_id", ids);
    check("deleteEventAnswers.groups", gErr);
  }
  return (data ?? []).length;
}

/**
 * Usuwa pytania (ich odpowiedzi i grupy – kaskada), czyści plan gry i stan gry,
 * bo oba wskazywałyby na nieistniejące pytania. Zwraca liczbę usuniętych pytań.
 */
export async function deleteEventQuestions(db: SupabaseClient, eventId: string): Promise<number> {
  const { data, error } = await db.from("questions").delete().eq("event_id", eventId).select("id");
  check("deleteEventQuestions", error);
  await updateGamePlan(db, eventId, emptyPlan());
  await resetGameState(db, eventId);
  return (data ?? []).length;
}

/** Usuwa wszystkie ankiety, grupy odpowiedzi i stan gry rozgrywki (pytania zostają). */
export async function deleteEventResponses(db: SupabaseClient, eventId: string): Promise<number> {
  const removed = await deleteEventAnswers(db, eventId);
  await resetGameState(db, eventId);
  return removed;
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initialGameState, parseGameState, type GameState } from "@/lib/game";
import type { Branding } from "@/lib/branding";
import { boardAnswers } from "@/lib/scoring";
import type { Board, BoardQuestion, GamePlan, Question } from "@/lib/types";
import { assert } from "@/lib/assert";
import { check } from "../db";
import { fetchAnswers, fetchGroups } from "./groups";

export async function fetchGameState(db: SupabaseClient, eventId: string): Promise<GameState> {
  const { data, error } = await db.from("game_state").select("state").eq("event_id", eventId).maybeSingle();
  check("fetchGameState", error);
  return parseGameState((data as { state: unknown } | null)?.state);
}

export async function upsertGameState(db: SupabaseClient, eventId: string, state: GameState): Promise<void> {
  const { error } = await db
    .from("game_state")
    .upsert({ event_id: eventId, state, updated_at: new Date().toISOString() });
  check("upsertGameState", error);
}

export type SaveResult = { saved: true } | { saved: false; newer: GameState } | { saved: false; newer: null };

/**
 * Zapisuje stan gry jednym zapytaniem (funkcja `upsert_game_state` w bazie), o ile w bazie nie ma nowszego
 * (wyższe `rev`). Sprawdzenie i zapis są atomowe. `newer: null` – nie ma takiej rozgrywki.
 */
export async function upsertGameStateIfNewer(db: SupabaseClient, eventId: string, state: GameState): Promise<SaveResult> {
  const { data, error } = await db.rpc("upsert_game_state", { p_event_id: eventId, p_state: state });
  check("upsertGameStateIfNewer", error);
  if (data === null) return { saved: false, newer: null };
  const result = data as { ok?: unknown; state?: unknown };
  assert(typeof result.ok === "boolean", "upsertGameStateIfNewer: unexpected result");
  return result.ok ? { saved: true } : { saved: false, newer: parseGameState(result.state) };
}

/**
 * Zeruje grę: zapisuje stan początkowy z numerem wersji wyższym niż obecny,
 * żeby otwarte tablice i pilot go przyjęły (zwykłe usunięcie wiersza by zignorowały).
 */
export async function resetGameState(db: SupabaseClient, eventId: string): Promise<void> {
  const current = await fetchGameState(db, eventId);
  await upsertGameState(db, eventId, { ...initialGameState(), rev: current.rev + 1 });
}

/** Wynik pytania gotowy na tablicę: top 6 grup z punktami. */
export async function fetchBoardQuestion(db: SupabaseClient, question: Question): Promise<BoardQuestion> {
  const [answers, groups] = await Promise.all([fetchAnswers(db, question.id), fetchGroups(db, question.id)]);
  return {
    questionId: question.id,
    text: question.text,
    respondents: answers.length,
    answers: boardAnswers(answers, groups),
  };
}

/** Odczyt pytań i punktów dla wszystkich rund i finału według planu gry (z oprawą: tytuł, organizatorzy). */
export async function fetchBoard(db: SupabaseClient, plan: GamePlan, questions: Question[], branding: Branding): Promise<Board> {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const load = (id: string | null) => {
    const q = id ? byId.get(id) : undefined;
    return q ? fetchBoardQuestion(db, q) : Promise.resolve(null);
  };
  const [rounds, final] = await Promise.all([Promise.all(plan.rounds.map(load)), Promise.all(plan.final.map(load))]);
  return { rounds, final, ...branding };
}

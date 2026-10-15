import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assert } from "@/lib/assert";
import { emptyPlan, FINAL_COUNT, ROUND_COUNT, type GamePlan } from "@/lib/types";
import { check } from "../db";

export interface EventRow {
  id: string;
  name: string;
  survey_open: boolean;
  is_test: boolean;
  game_plan: GamePlan;
}

function sanitizePlan(raw: unknown): GamePlan {
  const plan = emptyPlan();
  if (!raw || typeof raw !== "object") return plan;
  const r = raw as Partial<GamePlan>;
  const pick = (v: unknown, len: number) =>
    Array.from({ length: len }, (_, i) => (Array.isArray(v) && typeof v[i] === "string" ? (v[i] as string) : null));
  return { rounds: pick(r.rounds, ROUND_COUNT), final: pick(r.final, FINAL_COUNT) };
}

const EVENT_COLUMNS = "id, name, survey_open, is_test, game_plan";

function toEventRow(data: unknown): EventRow {
  const row = data as EventRow;
  return { ...row, game_plan: sanitizePlan(row.game_plan) };
}

export async function fetchEvent(db: SupabaseClient, eventId: string): Promise<EventRow | null> {
  const { data, error } = await db.from("events").select(EVENT_COLUMNS).eq("id", eventId).maybeSingle();
  check("fetchEvent", error);
  return data ? toEventRow(data) : null;
}

export async function updateSurveyOpen(db: SupabaseClient, eventId: string, open: boolean): Promise<void> {
  const { error } = await db.from("events").update({ survey_open: open }).eq("id", eventId);
  check("updateSurveyOpen", error);
}

export async function updateGamePlan(db: SupabaseClient, eventId: string, plan: GamePlan): Promise<void> {
  assert(plan.rounds.length === ROUND_COUNT && plan.final.length === FINAL_COUNT, "updateGamePlan: plan shape");
  const { error } = await db.from("events").update({ game_plan: plan }).eq("id", eventId);
  check("updateGamePlan", error);
}

async function countRole(db: SupabaseClient, eventId: string, role: string): Promise<number> {
  const { count, error } = await db
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("role", role);
  check("countRole", error);
  return count ?? 0;
}

export async function countSubmissions(db: SupabaseClient, eventId: string): Promise<{ wife: number; husband: number }> {
  const [wife, husband] = await Promise.all([countRole(db, eventId, "wife"), countRole(db, eventId, "husband")]);
  return { wife, husband };
}

export type SubmitResult = "ok" | "duplicate" | "closed" | "no_event";

/** Zapis ankiety w jednej transakcji (funkcja submit_survey w bazie). */
export async function insertSubmission(
  db: SupabaseClient,
  input: { eventId: string; deviceId: string; role: string; answers: { question_id: string; raw: string; normalized: string }[] },
): Promise<SubmitResult> {
  const { data, error } = await db.rpc("submit_survey", {
    p_event_id: input.eventId,
    p_device_id: input.deviceId,
    p_role: input.role,
    p_answers: input.answers,
  });
  check("insertSubmission", error);
  assert(["ok", "duplicate", "closed", "no_event"].includes(data as string), `insertSubmission: unexpected ${data}`);
  return data as SubmitResult;
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assert } from "@/lib/assert";
import type { BasicGroupingPlan, PlannedGroup } from "@/lib/grouping";
import type { ScoringAnswer, ScoringGroup } from "@/lib/scoring";
import { check } from "../db";

// PostgREST zwraca domyślnie max 1000 wierszy; jedno pytanie ma najwyżej ~80 odpowiedzi.
const MAX_ANSWERS_PER_QUESTION = 1000;

export async function fetchAnswers(db: SupabaseClient, questionId: string): Promise<ScoringAnswer[]> {
  const { data, error } = await db
    .from("answers")
    .select("raw, normalized, group_id")
    .eq("question_id", questionId)
    .limit(MAX_ANSWERS_PER_QUESTION);
  check("fetchAnswers", error);
  const rows = (data ?? []) as { raw: string; normalized: string; group_id: string | null }[];
  assert(rows.length < MAX_ANSWERS_PER_QUESTION, "fetchAnswers: answer limit reached, results would be truncated");
  return rows.map((r) => ({ raw: r.raw, normalized: r.normalized, groupId: r.group_id }));
}

export async function fetchGroups(db: SupabaseClient, questionId: string): Promise<ScoringGroup[]> {
  const { data, error } = await db.from("answer_groups").select("id, label, hidden").eq("question_id", questionId);
  check("fetchGroups", error);
  return (data ?? []) as ScoringGroup[];
}

async function assignMembers(db: SupabaseClient, questionId: string, groupId: string, members: string[]): Promise<void> {
  if (members.length === 0) return;
  const { error } = await db
    .from("answers")
    .update({ group_id: groupId })
    .eq("question_id", questionId)
    .in("normalized", members);
  check("assignMembers", error);
}

/** Tworzy grupy i przypisuje do nich odpowiedzi (po `normalized`). */
export async function insertGroups(db: SupabaseClient, questionId: string, groups: PlannedGroup[]): Promise<void> {
  if (groups.length === 0) return;
  const { data, error } = await db
    .from("answer_groups")
    .insert(groups.map((g) => ({ question_id: questionId, label: g.label })))
    .select("id");
  check("insertGroups", error);
  const ids = (data ?? []) as { id: string }[];
  assert(ids.length === groups.length, "insertGroups: inserted row count mismatch");
  await Promise.all(groups.map((g, i) => assignMembers(db, questionId, ids[i]!.id, g.members)));
}

/** Zapisuje plan grupowania bez AI (dołączenie do istniejących + nowe grupy). */
export async function applyBasicGrouping(db: SupabaseClient, questionId: string, plan: BasicGroupingPlan): Promise<void> {
  await Promise.all(plan.attach.map((a) => assignMembers(db, questionId, a.groupId, [a.normalized])));
  await insertGroups(db, questionId, plan.create);
}

/** Usuwa wszystkie grupy pytania (odpowiedzi wracają do stanu niepogrupowanego). */
export async function deleteAllGroups(db: SupabaseClient, questionId: string): Promise<void> {
  const { error } = await db.from("answer_groups").delete().eq("question_id", questionId);
  check("deleteAllGroups", error);
}

async function assertGroupInQuestion(db: SupabaseClient, questionId: string, groupId: string): Promise<void> {
  const { data, error } = await db
    .from("answer_groups")
    .select("id")
    .eq("id", groupId)
    .eq("question_id", questionId)
    .maybeSingle();
  check("assertGroupInQuestion", error);
  assert(data, "group does not belong to the question");
}

/** Usuwa grupy pytania, do których nie należy już żadna odpowiedź. */
export async function deleteEmptyGroups(db: SupabaseClient, questionId: string): Promise<void> {
  const [groups, answers] = await Promise.all([fetchGroups(db, questionId), fetchAnswers(db, questionId)]);
  const used = new Set(answers.map((a) => a.groupId));
  const empty = groups.filter((g) => !used.has(g.id)).map((g) => g.id);
  if (empty.length === 0) return;
  const { error } = await db.from("answer_groups").delete().in("id", empty);
  check("deleteEmptyGroups", error);
}

/** Przenosi wszystkie odpowiedzi o danym `normalized` do grupy (istniejącej albo nowej). */
export async function moveAnswer(
  db: SupabaseClient,
  questionId: string,
  normalized: string,
  target: { groupId: string } | { newLabel: string },
): Promise<void> {
  if ("groupId" in target) {
    await assertGroupInQuestion(db, questionId, target.groupId);
    await assignMembers(db, questionId, target.groupId, [normalized]);
  } else {
    await insertGroups(db, questionId, [{ label: target.newLabel, members: [normalized] }]);
  }
  await deleteEmptyGroups(db, questionId);
}

/** Scala grupę `fromId` do `intoId`. */
export async function mergeGroups(db: SupabaseClient, questionId: string, fromId: string, intoId: string): Promise<void> {
  assert(fromId !== intoId, "mergeGroups: cannot merge a group into itself");
  await Promise.all([assertGroupInQuestion(db, questionId, fromId), assertGroupInQuestion(db, questionId, intoId)]);
  const { error } = await db.from("answers").update({ group_id: intoId }).eq("group_id", fromId);
  check("mergeGroups", error);
  const { error: delErr } = await db.from("answer_groups").delete().eq("id", fromId);
  check("mergeGroups.delete", delErr);
}

export async function updateGroup(
  db: SupabaseClient,
  questionId: string,
  groupId: string,
  patch: { label?: string; hidden?: boolean },
): Promise<void> {
  assert(Object.keys(patch).length > 0, "updateGroup: empty patch");
  const { error } = await db.from("answer_groups").update(patch).eq("id", groupId).eq("question_id", questionId);
  check("updateGroup", error);
}

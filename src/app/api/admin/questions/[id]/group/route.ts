import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { planBasicGrouping, reconcileAiGroups, uniqueAnswers } from "@/lib/grouping";
import { GroupModeSchema } from "@/lib/schemas";
import type { Question } from "@/lib/types";
import { AiUnavailableError, requestAiGrouping } from "@/lib/server/ai";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { applyBasicGrouping, deleteAllGroups, fetchAnswers, insertGroups } from "@/lib/server/repo/groups";
import { fetchQuestion } from "@/lib/server/repo/questions";

type Params = { params: Promise<{ id: string }> };

// Grupowanie z AI może potrwać kilkadziesiąt sekund.
export const maxDuration = 120;

/** Bez AI: dopisuje niepogrupowane odpowiedzi do grup po `normalized`. */
async function groupBasic(db: SupabaseClient, questionId: string): Promise<NextResponse> {
  const answers = await fetchAnswers(db, questionId);
  await applyBasicGrouping(db, questionId, planBasicGrouping(answers));
  return NextResponse.json({ ok: true, mode: "basic" });
}

/** Z AI: zastępuje wszystkie grupy pytania propozycją Claude (zwalidowaną). */
async function groupWithAi(db: SupabaseClient, question: Question): Promise<NextResponse> {
  const answers = await fetchAnswers(db, question.id);
  const uniques = uniqueAnswers(answers);
  if (uniques.length === 0) return jsonError("Brak odpowiedzi do pogrupowania.", 400);
  try {
    const proposal = await requestAiGrouping(question.text, uniques);
    const groups = reconcileAiGroups(proposal, uniques);
    await deleteAllGroups(db, question.id);
    await insertGroups(db, question.id, groups);
    return NextResponse.json({ ok: true, mode: "ai", groups: groups.length });
  } catch (err) {
    if (!(err instanceof AiUnavailableError)) throw err;
    console.warn("[group.ai]", err.message);
    return jsonError(`${err.message} Użyj grupowania bez AI.`, 503);
  }
}

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const body = await parseBody(req, GroupModeSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "question.group", async ({ db, event }) => {
    const question = await fetchQuestion(db, event.id, id);
    if (!question) return jsonError("Nie ma takiego pytania.", 404);
    return body.mode === "ai" ? groupWithAi(db, question) : groupBasic(db, question.id);
  });
}

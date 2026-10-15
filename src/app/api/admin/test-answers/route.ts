import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import rawPools from "@/lib/data/test-answers.json";
import { TestAnswersSchema } from "@/lib/schemas";
import { prepareAnswers } from "@/lib/submission";
import { buildTestAnswers, parsePools } from "@/lib/testAnswers";
import type { Question, Role } from "@/lib/types";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { deleteEventResponses } from "@/lib/server/repo/eventAdmin";
import { insertSubmission } from "@/lib/server/repo/events";
import { fetchQuestions } from "@/lib/server/repo/questions";

const POOLS = parsePools(rawPools);
const NOT_TEST = "To działa tylko w rozgrywce testowej – prawdziwych odpowiedzi nie mieszamy z testowymi.";

/** Widoczne pytania (opcjonalnie tylko z listy), które mają pulę odpowiedzi testowych. */
function selectQuestions(all: Question[], ids: string[] | undefined): Question[] {
  const wanted = ids ? new Set(ids) : null;
  return all.filter((q) => !q.hidden && POOLS[q.text] !== undefined && (!wanted || wanted.has(q.id)));
}

/** Rola i-tej testowej ankiety: stała albo na zmianę żona / mąż. */
function roleFor(respondents: Role | "all", i: number): Role {
  if (respondents !== "all") return respondents;
  return i % 2 === 0 ? "wife" : "husband";
}

/** Dodaje losowe ankiety (pule z literówkami i synonimami) do rozgrywki testowej. */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, TestAnswersSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "test answers", async ({ db, event }) => {
    if (!event.is_test) return jsonError(NOT_TEST, 409);
    if (!event.survey_open) return jsonError("Ankieta jest zamknięta – otwórz ją, żeby dodać odpowiedzi.", 409);
    const questions = selectQuestions(await fetchQuestions(db, event.id), body.questionIds);
    if (questions.length === 0) return jsonError("Dla wybranych pytań nie ma przykładowych odpowiedzi testowych.", 409);
    let added = 0;
    for (let i = 0; i < body.count; i++) {
      const role = roleFor(body.respondents, i);
      const answers = prepareAnswers(buildTestAnswers(questions, POOLS, role, Math.random));
      if (answers.length === 0) continue;
      const result = await insertSubmission(db, { eventId: event.id, deviceId: randomUUID(), role, answers });
      if (result !== "ok") return jsonError(`Przerwano po ${added} ankietach: ${result}.`, 409);
      added += 1;
    }
    return NextResponse.json({ ok: true, added });
  });
}

/** Czyści ankiety, grupy i stan gry rozgrywki testowej (pytania zostają). */
export async function DELETE(req: Request): Promise<NextResponse> {
  return adminRoute(req, "test answers clear", async ({ db, event }) => {
    if (!event.is_test) return jsonError(NOT_TEST, 409);
    const removed = await deleteEventResponses(db, event.id);
    return NextResponse.json({ ok: true, removed });
  });
}

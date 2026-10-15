import { NextResponse } from "next/server";
import { assert } from "@/lib/assert";
import { cleanRawAnswer, normalizeAnswer } from "@/lib/normalize";
import { SubmitSchema } from "@/lib/schemas";
import { MAX_ANSWER_LENGTH } from "@/lib/types";
import { serviceClient } from "@/lib/server/db";
import { jsonError, parseBody, serverError } from "@/lib/server/http";
import { insertSubmission } from "@/lib/server/repo/events";

type SubmitAnswer = { questionId: string; text: string };

function prepareAnswers(answers: SubmitAnswer[]) {
  const seen = new Set<string>();
  return answers.flatMap((a) => {
    const raw = cleanRawAnswer(a.text, MAX_ANSWER_LENGTH);
    if (raw === null || seen.has(a.questionId)) return [];
    seen.add(a.questionId);
    return [{ question_id: a.questionId, raw, normalized: normalizeAnswer(raw) }];
  });
}

const MESSAGES = {
  duplicate: ["Już odpowiedziałeś, dziękujemy!", 409],
  closed: ["Ankieta jest już zamknięta.", 403],
  no_event: ["Ankieta nie jest jeszcze gotowa.", 404],
} as const;

/** Publiczny zapis ankiety: jedna ankieta na urządzenie, puste zgłoszenia odrzucane. */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, SubmitSchema);
  if (body instanceof NextResponse) return body;
  const answers = prepareAnswers(body.answers);
  if (answers.length === 0) return jsonError("Wpisz przynajmniej jedną odpowiedź.", 400);
  try {
    const result = await insertSubmission(serviceClient(), {
      eventId: body.eventId, deviceId: body.deviceId, role: body.role, answers,
    });
    if (result === "ok") return NextResponse.json({ ok: true });
    const [message, status] = MESSAGES[result];
    assert(message, "submit: unknown result");
    return NextResponse.json({ error: message, code: result }, { status });
  } catch (err) {
    return serverError("submit", err);
  }
}

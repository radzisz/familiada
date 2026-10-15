import { NextResponse } from "next/server";
import { buildQuestionDetail } from "@/lib/detail";
import { QuestionPatchSchema } from "@/lib/schemas";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { fetchAnswers, fetchGroups } from "@/lib/server/repo/groups";
import { fetchQuestion, updateQuestion } from "@/lib/server/repo/questions";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** Szczegóły grupowania pytania. */
export async function GET(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  return adminRoute(req, "question.get", async ({ db, event }) => {
    const question = await fetchQuestion(db, event.id, id);
    if (!question) return jsonError("Nie ma takiego pytania.", 404);
    const [answers, groups] = await Promise.all([fetchAnswers(db, id), fetchGroups(db, id)]);
    return NextResponse.json({ question, ...buildQuestionDetail(answers, groups) });
  });
}

/** Zmiana treści, grupy odbiorców albo ukrycie pytania. */
export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const body = await parseBody(req, QuestionPatchSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "question.patch", async ({ db, event }) => {
    await updateQuestion(db, event.id, id, body);
    return NextResponse.json({ ok: true });
  });
}

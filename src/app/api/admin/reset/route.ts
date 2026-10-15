import { NextResponse } from "next/server";
import { ResetSchema } from "@/lib/schemas";
import { parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { deleteEventAnswers, deleteEventQuestions } from "@/lib/server/repo/eventAdmin";
import { resetGameState } from "@/lib/server/repo/game";

/** Czyści jedną część rozgrywki: stan gry, odpowiedzi (z grupami) albo pytania. */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, ResetSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, `reset ${body.target}`, async ({ db, event }) => {
    if (body.target === "game") {
      await resetGameState(db, event.id);
      return NextResponse.json({ ok: true, removed: 0 });
    }
    const removed = body.target === "answers"
      ? await deleteEventAnswers(db, event.id)
      : await deleteEventQuestions(db, event.id);
    return NextResponse.json({ ok: true, removed });
  });
}

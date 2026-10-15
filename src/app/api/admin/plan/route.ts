import { NextResponse } from "next/server";
import { PlanSchema } from "@/lib/schemas";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { updateGamePlan } from "@/lib/server/repo/events";
import { fetchQuestions } from "@/lib/server/repo/questions";

export async function PUT(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, PlanSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute("plan", async ({ db, event }) => {
    const known = new Set((await fetchQuestions(db, event.id)).map((q) => q.id));
    const ids = [...body.rounds, ...body.final].filter((id): id is string => id !== null);
    if (!ids.every((id) => known.has(id))) return jsonError("Nieznane pytanie w planie gry.", 400);
    await updateGamePlan(db, event.id, body);
    return NextResponse.json({ ok: true });
  });
}

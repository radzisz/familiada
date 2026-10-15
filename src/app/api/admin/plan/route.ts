import { NextResponse } from "next/server";
import { PlanSchema } from "@/lib/schemas";
import { fetchPlanCandidates } from "@/lib/server/candidates";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { updateGamePlan } from "@/lib/server/repo/events";
import { fetchQuestions } from "@/lib/server/repo/questions";

export const dynamic = "force-dynamic";

/** Wynik każdego widocznego pytania (podgląd tablicy przy wyborze pytań do gry). */
export async function GET(req: Request): Promise<NextResponse> {
  return adminRoute(req, "plan candidates", async ({ db, event }) => {
    return NextResponse.json({ candidates: await fetchPlanCandidates(db, event.id) });
  });
}

export async function PUT(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, PlanSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "plan", async ({ db, event }) => {
    const known = new Set((await fetchQuestions(db, event.id)).map((q) => q.id));
    const ids = [...body.rounds, ...body.final].filter((id): id is string => id !== null);
    if (!ids.every((id) => known.has(id))) return jsonError("Nieznane pytanie w planie gry.", 400);
    await updateGamePlan(db, event.id, body);
    return NextResponse.json({ ok: true });
  });
}

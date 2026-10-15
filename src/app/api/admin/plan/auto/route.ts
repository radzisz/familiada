import { NextResponse } from "next/server";
import { autoPlan } from "@/lib/autoplan";
import { AutoPlanSchema } from "@/lib/schemas";
import { fetchPlanCandidates } from "@/lib/server/candidates";
import { parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { updateGamePlan } from "@/lib/server/repo/events";

/** Wybiera pytania do gry automatycznie (`fill`: tylko puste miejsca, `all`: od nowa) i zapisuje plan. */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, AutoPlanSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "plan auto", async ({ db, event }) => {
    const candidates = await fetchPlanCandidates(db, event.id);
    const plan = autoPlan(candidates, event.game_plan, body.mode);
    await updateGamePlan(db, event.id, plan);
    return NextResponse.json({ ok: true, plan });
  });
}

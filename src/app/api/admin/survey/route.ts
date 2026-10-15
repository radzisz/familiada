import { NextResponse } from "next/server";
import { SurveyOpenSchema } from "@/lib/schemas";
import { parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { updateSurveyOpen } from "@/lib/server/repo/events";

export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, SurveyOpenSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "survey", async ({ db, event }) => {
    await updateSurveyOpen(db, event.id, body.open);
    return NextResponse.json({ ok: true });
  });
}

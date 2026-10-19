import { NextResponse } from "next/server";
import { z } from "zod";
import { RETREAT_MAX } from "@/lib/opinions";
import { buildReport, summaryInput } from "@/lib/opinionsReport";
import { AiUnavailableError, requestOpinionSummary } from "@/lib/server/ai";
import { jsonError, parseBody } from "@/lib/server/http";
import { fetchOpinions } from "@/lib/server/repo/opinions";
import { adminDbRoute } from "@/lib/server/route";

const BodySchema = z.object({ retreat: z.string().trim().max(RETREAT_MAX).nullable() });

/** Podsumowanie opinii przez AI (z odpowiedziami otwartymi) – liczone na żądanie, niezapisywane. */
export async function POST(req: Request): Promise<NextResponse> {
  return adminDbRoute("admin.opinie.podsumowanie", async (db) => {
    const body = await parseBody(req, BodySchema);
    if (body instanceof NextResponse) return body;
    const rows = await fetchOpinions(db, body.retreat);
    if (rows.length === 0) return jsonError("Brak opinii do podsumowania.", 400);
    try {
      return NextResponse.json(await requestOpinionSummary(summaryInput(buildReport(rows))));
    } catch (err) {
      if (!(err instanceof AiUnavailableError)) throw err;
      return jsonError(err.message, 503);
    }
  });
}

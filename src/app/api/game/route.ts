import { NextResponse } from "next/server";
import { z } from "zod";
import { parseGameState } from "@/lib/game";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminEventIdRoute, adminRoute } from "@/lib/server/route";
import { brandingOf } from "@/lib/server/repo/events";
import { fetchBoard, fetchGameState, upsertGameStateIfNewer } from "@/lib/server/repo/game";
import { fetchQuestions } from "@/lib/server/repo/questions";

export const dynamic = "force-dynamic";

/**
 * Stan gry rozgrywki z `?event=<id>` – jedno zapytanie do bazy (odpytywanie i odświeżenie po zapisie
 * z pilota). Z `&board=1` także pytania, punkty i oprawa – raz przy otwarciu tablicy i przy „Dalej”.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (new URL(req.url).searchParams.get("board") !== "1") {
    return adminEventIdRoute(req, "game.get", async ({ db, eventId }) => NextResponse.json({ state: await fetchGameState(db, eventId) }));
  }
  return adminRoute(req, "game.get board", async ({ db, event }) => {
    const [state, questions] = await Promise.all([fetchGameState(db, event.id), fetchQuestions(db, event.id)]);
    const board = await fetchBoard(db, event.game_plan, questions, brandingOf(event));
    return NextResponse.json({ state, board });
  });
}

const PutSchema = z.object({ state: z.unknown() });

/** Zapis stanu gry jednym zapytaniem do bazy; starszy stan (niższe `rev`) nie nadpisuje nowszego. */
export async function PUT(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, PutSchema);
  if (body instanceof NextResponse) return body;
  const incoming = parseGameState(body.state);
  return adminEventIdRoute(req, "game.put", async ({ db, eventId }) => {
    const result = await upsertGameStateIfNewer(db, eventId, incoming);
    if (result.saved) return NextResponse.json({ ok: true });
    if (!result.newer) return jsonError("Nie ma takiej rozgrywki.", 404);
    return NextResponse.json({ ok: false, state: result.newer });
  });
}

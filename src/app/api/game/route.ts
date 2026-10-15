import { NextResponse } from "next/server";
import { z } from "zod";
import { parseGameState } from "@/lib/game";
import { parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { brandingOf } from "@/lib/server/repo/events";
import { fetchBoard, fetchGameState, upsertGameState } from "@/lib/server/repo/game";
import { fetchQuestions } from "@/lib/server/repo/questions";

export const dynamic = "force-dynamic";

/** Stan gry rozgrywki z `?event=<id>`; z `&board=1` także pytania i punkty dla rund i finału. */
export async function GET(req: Request): Promise<NextResponse> {
  const withBoard = new URL(req.url).searchParams.get("board") === "1";
  return adminRoute(req, "game.get", async ({ db, event }) => {
    const state = await fetchGameState(db, event.id);
    if (!withBoard) return NextResponse.json({ state });
    const board = await fetchBoard(db, event.game_plan, await fetchQuestions(db, event.id), brandingOf(event));
    return NextResponse.json({ state, board });
  });
}

const PutSchema = z.object({ state: z.unknown() });

/** Zapis stanu gry; starszy stan (niższe `rev`) nie nadpisuje nowszego. */
export async function PUT(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, PutSchema);
  if (body instanceof NextResponse) return body;
  const incoming = parseGameState(body.state);
  return adminRoute(req, "game.put", async ({ db, event }) => {
    const current = await fetchGameState(db, event.id);
    if (current.rev > incoming.rev) return NextResponse.json({ ok: false, state: current });
    await upsertGameState(db, event.id, incoming);
    return NextResponse.json({ ok: true });
  });
}

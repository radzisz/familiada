import { NextResponse } from "next/server";
import { NewEventSchema } from "@/lib/schemas";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminDbRoute } from "@/lib/server/route";
import { fetchEvent } from "@/lib/server/repo/events";
import {
  copyQuestions, deleteEvent, fetchEventSummaries, insertDefaultQuestions, insertEvent,
} from "@/lib/server/repo/eventAdmin";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return adminDbRoute("events list", async (db) => NextResponse.json({ events: await fetchEventSummaries(db) }));
}

/** Nowa rozgrywka z pytaniami (domyślnymi, skopiowanymi albo bez); zwraca jej id. */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, NewEventSchema);
  if (body instanceof NextResponse) return body;
  return adminDbRoute("events create", async (db) => {
    const source = body.questionsFrom;
    if (source !== "default" && source !== "none" && !(await fetchEvent(db, source))) {
      return jsonError("Nie ma rozgrywki, z której miały być skopiowane pytania.", 400);
    }
    const id = await insertEvent(db, { name: body.name, isTest: body.isTest });
    try {
      if (source === "default") await insertDefaultQuestions(db, id);
      else if (source !== "none") await copyQuestions(db, source, id);
    } catch (err) {
      // Bez pytań rozgrywka byłaby niepełna – usuń ją, zanim zgłosisz błąd.
      await deleteEvent(db, id);
      throw err;
    }
    return NextResponse.json({ ok: true, id });
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { EventPatchSchema } from "@/lib/schemas";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminDbRoute } from "@/lib/server/route";
import { fetchEvent } from "@/lib/server/repo/events";
import { deleteEvent, updateEvent } from "@/lib/server/repo/eventAdmin";

type Ctx = { params: Promise<{ id: string }> };

async function eventId(ctx: Ctx): Promise<string | null> {
  const { id } = await ctx.params;
  return z.uuid().safeParse(id).success ? id : null;
}

/** Zmiana nazwy albo oznaczenia „testowa”. */
export async function PATCH(req: Request, ctx: Ctx): Promise<NextResponse> {
  const id = await eventId(ctx);
  if (!id) return jsonError("Nieprawidłowy identyfikator rozgrywki.", 400);
  const body = await parseBody(req, EventPatchSchema);
  if (body instanceof NextResponse) return body;
  return adminDbRoute("events patch", async (db) => {
    if (!(await fetchEvent(db, id))) return jsonError("Nie ma takiej rozgrywki.", 404);
    await updateEvent(db, id, body);
    return NextResponse.json({ ok: true });
  });
}

/** Usuwa rozgrywkę ze wszystkimi danymi (pytania, ankiety, grupy, stan gry). */
export async function DELETE(_req: Request, ctx: Ctx): Promise<NextResponse> {
  const id = await eventId(ctx);
  if (!id) return jsonError("Nieprawidłowy identyfikator rozgrywki.", 400);
  return adminDbRoute("events delete", async (db) => {
    if (await deleteEvent(db, id)) return NextResponse.json({ ok: true });
    return jsonError("Nie ma takiej rozgrywki.", 404);
  });
}

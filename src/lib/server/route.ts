import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "./auth";
import { serviceClient } from "./db";
import { jsonError, serverError } from "./http";
import { fetchEvent, type EventRow } from "./repo/events";

export interface AdminContext {
  db: SupabaseClient;
  event: EventRow;
}

/** Id rozgrywki z parametru `?event=<uuid>` (null, gdy brak albo nie jest to UUID). */
export function eventIdFrom(req: Request): string | null {
  const id = new URL(req.url).searchParams.get("event");
  return id !== null && z.uuid().safeParse(id).success ? id : null;
}

/**
 * Wspólny szkielet endpointów jednej rozgrywki: sprawdza PIN, ładuje rozgrywkę z `?event=<id>`
 * i zamienia każdy nieoczekiwany wyjątek na zalogowany błąd 500.
 */
export async function adminRoute(
  req: Request,
  context: string,
  handler: (ctx: AdminContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const eventId = eventIdFrom(req);
  if (!eventId) return jsonError("Brak lub nieprawidłowy identyfikator rozgrywki (?event=…).", 400);
  try {
    const db = serviceClient();
    const event = await fetchEvent(db, eventId);
    if (!event) return jsonError("Nie ma takiej rozgrywki.", 404);
    return await handler({ db, event });
  } catch (err) {
    return serverError(context, err);
  }
}

/** Jak `adminRoute`, ale bez konkretnej rozgrywki (lista rozgrywek, tworzenie, usuwanie). */
export async function adminDbRoute(
  context: string,
  handler: (db: SupabaseClient) => Promise<NextResponse>,
): Promise<NextResponse> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    return await handler(serviceClient());
  } catch (err) {
    return serverError(context, err);
  }
}

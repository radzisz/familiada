import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "./auth";
import { serviceClient } from "./db";
import { jsonError, serverError } from "./http";
import { fetchActiveEvent, type EventRow } from "./repo/events";

export interface AdminContext {
  db: SupabaseClient;
  event: EventRow;
}

/**
 * Wspólny szkielet endpointów prowadzącego: sprawdza PIN, ładuje aktywne wydarzenie
 * i zamienia każdy nieoczekiwany wyjątek na zalogowany błąd 500.
 */
export async function adminRoute(
  context: string,
  handler: (ctx: AdminContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  try {
    const db = serviceClient();
    const event = await fetchActiveEvent(db);
    if (!event) return jsonError("Brak aktywnego wydarzenia – uruchom seed (npm run seed).", 409);
    return await handler({ db, event });
  } catch (err) {
    return serverError(context, err);
  }
}

import "server-only";
import { z } from "zod";
import { serviceClient } from "./db";
import { fetchEvent, type EventRow } from "./repo/events";

/** Rozgrywka z segmentu adresu `/…/<id>` (null, gdy id jest błędne albo rozgrywki nie ma). */
export async function fetchEventForPage(id: string): Promise<EventRow | null> {
  if (!z.uuid().safeParse(id).success) return null;
  return fetchEvent(serviceClient(), id);
}

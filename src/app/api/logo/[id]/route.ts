import { NextResponse } from "next/server";
import { z } from "zod";
import { serviceClient } from "@/lib/server/db";
import { jsonError, serverError } from "@/lib/server/http";
import { fetchPartnerLogo } from "@/lib/server/repo/events";

/** Adres ma wersję (`?v=`), więc ten sam URL zawsze znaczy ten sam obrazek. */
const CACHE = "public, max-age=31536000, immutable";
const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/;

/**
 * Logo współorganizatora jako zwykły obrazek. Publiczne (pokazuje je ankieta); z bazy czytane tylko tu,
 * a nie przy każdym zapytaniu o ustawienia czy stan gry.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return jsonError("Nieprawidłowy identyfikator rozgrywki.", 400);
  try {
    const logo = await fetchPartnerLogo(serviceClient(), id);
    if (!logo) return jsonError("Ta rozgrywka nie ma logo współorganizatora.", 404);
    if (logo.startsWith("/logos/")) {
      return NextResponse.redirect(new URL(logo, req.url), { headers: { "Cache-Control": CACHE } });
    }
    const match = DATA_URL.exec(logo);
    if (!match) return serverError("logo", new Error(`logo ${id}: nieznany format`));
    const bytes = Buffer.from(match[2]!, "base64");
    return new NextResponse(bytes, { headers: { "Content-Type": match[1]!, "Cache-Control": CACHE } });
  } catch (err) {
    return serverError("logo", err);
  }
}

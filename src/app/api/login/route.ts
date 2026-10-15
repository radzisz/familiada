import { NextResponse } from "next/server";
import { LoginSchema } from "@/lib/schemas";
import { pinMatches } from "@/lib/token";
import { setSessionCookie } from "@/lib/server/auth";
import { env } from "@/lib/server/env";
import { jsonError, parseBody } from "@/lib/server/http";

const FAIL_DELAY_MS = 600;

export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, LoginSchema);
  if (body instanceof NextResponse) return body;
  if (!pinMatches(body.pin, env.adminPin())) {
    // Spowalnia zgadywanie PIN-u.
    await new Promise((resolve) => setTimeout(resolve, FAIL_DELAY_MS));
    console.warn("[login] nieudana próba logowania");
    return jsonError("Nieprawidłowy PIN.", 401);
  }
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res);
  return res;
}

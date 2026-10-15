import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_TTL_MS, verifySessionToken } from "@/lib/token";
import { env } from "./env";

export const SESSION_COOKIE = "familiada_admin";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, env.adminPin(), Date.now());
}

/** Zwraca odpowiedź 401, jeśli brak sesji prowadzącego; null gdy wszystko w porządku. */
export async function denyUnlessAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "Brak dostępu – zaloguj się PIN-em." }, { status: 401 });
}

export function setSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, createSessionToken(env.adminPin(), Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { assert } from "./assert";

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Token sesji prowadzącego: "<expiresAtMs>.<hmac>". */
export function createSessionToken(secret: string, nowMs: number): string {
  assert(secret.length > 0, "createSessionToken: secret required");
  const payload = String(nowMs + SESSION_TTL_MS);
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string, nowMs: number): boolean {
  if (!token || secret.length === 0) return false;
  const [payload, mac, ...rest] = token.split(".");
  if (!payload || !mac || rest.length > 0) return false;
  const expires = Number(payload);
  if (!Number.isFinite(expires) || expires < nowMs) return false;
  return safeEqual(mac, sign(payload, secret));
}

/** Porównanie PIN-u w stałym czasie (po skrócie, żeby długości były równe). */
export function pinMatches(candidate: string, pin: string): boolean {
  if (pin.length === 0) return false;
  return safeEqual(sign(candidate, "pin"), sign(pin, "pin"));
}

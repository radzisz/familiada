import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Parsuje ciało żądania schematem zod; zwraca dane albo odpowiedź 400. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T | NextResponse> {
  const raw: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError("Nieprawidłowe dane żądania.", 400);
  return parsed.data;
}

/** Loguje nieoczekiwany błąd i zwraca 500 – żaden błąd nie znika po cichu. */
export function serverError(context: string, err: unknown): NextResponse {
  console.error(`[${context}]`, err);
  return jsonError("Błąd serwera. Spróbuj ponownie.", 500);
}

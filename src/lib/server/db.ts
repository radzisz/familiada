import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/** Klient z kluczem service role – tylko po stronie serwera. Bezstanowy, nie wymaga zamykania. */
export function serviceClient(): SupabaseClient {
  return createClient(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class DbError extends Error {
  constructor(context: string, message: string) {
    super(`${context}: ${message}`);
    this.name = "DbError";
  }
}

/** Rzuca DbError, gdy zapytanie Supabase zwróciło błąd. */
export function check(context: string, error: { message: string } | null): void {
  if (error) throw new DbError(context, error.message);
}

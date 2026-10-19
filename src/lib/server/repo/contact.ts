import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { check } from "../db";

export interface ContactRequestRow {
  id: string;
  created_at: string;
  topic: string;
  name: string | null;
  email: string;
  organization: string | null;
  message: string | null;
  source: string | null;
}

/** Zapytania ze strony, od najnowszych. */
export async function fetchContactRequests(db: SupabaseClient): Promise<ContactRequestRow[]> {
  const { data, error } = await db
    .from("contact_requests")
    .select("id, created_at, topic, name, email, organization, message, source")
    .order("created_at", { ascending: false });
  check("contact_requests.select", error);
  return (data ?? []) as ContactRequestRow[];
}

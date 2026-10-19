import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_BRANDING, type Branding } from "@/lib/branding";
import type { OpinionRow } from "@/lib/opinionsReport";
import { check } from "../db";
import { brandingOf, fetchLatestEvent } from "./events";

/** Opinie od najnowszych; `retreat` zawęża do jednych rekolekcji. */
export async function fetchOpinions(db: SupabaseClient, retreat: string | null = null): Promise<OpinionRow[]> {
  let query = db.from("opinions").select("id, created_at, retreat, answers").order("created_at", { ascending: false });
  if (retreat !== null) query = query.eq("retreat", retreat);
  const { data, error } = await query;
  check("opinions.select", error);
  return (data ?? []) as OpinionRow[];
}

export interface ContactRow {
  id: string;
  created_at: string;
  retreat: string | null;
  name: string | null;
  email: string;
}

export async function fetchContacts(db: SupabaseClient): Promise<ContactRow[]> {
  const { data, error } = await db
    .from("opinion_contacts").select("id, created_at, retreat, name, email").order("created_at", { ascending: false });
  check("opinion_contacts.select", error);
  return (data ?? []) as ContactRow[];
}

/** Oprawa z najnowszej rozgrywki Familiady (nazwa wydarzenia, loga); bez niej – domyślna. */
export async function loadOpinionBranding(db: SupabaseClient): Promise<Branding> {
  try {
    const event = await fetchLatestEvent(db);
    if (!event) return DEFAULT_BRANDING;
    const branding = brandingOf(event);
    // W nagłówku nazwa wydarzenia zamiast tytułu tablicy („Familiada…”) – to ankieta o całych rekolekcjach.
    return { ...branding, title: branding.eventName ?? branding.title };
  } catch (err) {
    console.error("[opinie] branding", err);
    return DEFAULT_BRANDING;
  }
}

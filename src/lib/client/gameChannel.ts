"use client";

import { createClient } from "@supabase/supabase-js";

/** Kanał Realtime gry: „zapisałem wersję N” – inne ekrany od razu pobierają stan zamiast czekać na odpytanie. */
export interface GameChannel {
  /** Ogłasza zapis stanu o numerze `rev` (bez treści stanu – ten zawsze idzie przez API z PIN-em). */
  announce: (rev: number) => void;
  close: () => void;
}

const SAVED_EVENT = "saved";

/** Publiczne dane Supabase dla przeglądarki; bez nich działa samo odpytywanie. */
function publicSupabase(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

/**
 * Otwiera kanał Realtime (broadcast) rozgrywki. Wiadomość niesie tylko numer wersji, więc kanał
 * nie zdradza stanu gry, a fałszywa wiadomość najwyżej wywoła zwykłe pobranie stanu przez API.
 * Zwraca null, gdy brak publicznego klucza – wtedy zostaje odpytywanie.
 */
export function openGameChannel(eventId: string, onSaved: (rev: number) => void, onLive: (live: boolean) => void): GameChannel | null {
  if (eventId === "") throw new Error("openGameChannel: brak id rozgrywki");
  const config = publicSupabase();
  if (!config) {
    console.warn("[realtime] brak NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY – synchronizacja tylko przez odpytywanie");
    return null;
  }
  const client = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  const channel = client.channel(`game:${eventId}`, { config: { broadcast: { self: false } } });
  channel.on("broadcast", { event: SAVED_EVENT }, ({ payload }) => {
    const rev = Number((payload as { rev?: unknown } | undefined)?.rev);
    if (Number.isInteger(rev)) onSaved(rev);
  });
  channel.subscribe((status, err) => {
    if (err) console.warn("[realtime]", status, err);
    onLive(status === "SUBSCRIBED");
  });
  return {
    announce: (rev) => {
      channel.send({ type: "broadcast", event: SAVED_EVENT, payload: { rev } })
        .then((result) => { if (result !== "ok") console.warn("[realtime] send", result); })
        .catch((e: unknown) => console.warn("[realtime] send failed", e));
    },
    close: () => {
      client.removeChannel(channel).catch((e: unknown) => console.warn("[realtime] close failed", e));
    },
  };
}

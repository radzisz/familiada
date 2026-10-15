"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/client/api";
import { AdminHeader } from "./AdminHeader";
import { EventItem, type EventSummary } from "./EventItem";
import { NewEventDialog } from "./NewEventDialog";
import "./admin.css";

function useEvents() {
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    const res = await apiJson<{ events: EventSummary[] }>("/api/admin/events");
    if (!res.ok) return setError(res.error);
    setError("");
    setEvents(res.data.events);
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { events, error, reload };
}

/** `/admin`: lista rozgrywek z linkami (panel, ankieta, QR, tablica) i tworzenie nowej. */
export function EventsApp() {
  const { events, error, reload } = useEvents();
  return (
    <main className="ad">
      <AdminHeader title="Familiada – rozgrywki" />
      <section className="ad-panel" aria-label="Rozgrywki">
        <div className="ad-events-head">
          <NewEventDialog events={events ?? []} />
        </div>
        <p className="ad-muted">
          Każda rozgrywka ma własny link do ankiety (i kod QR), pytania, odpowiedzi, wybór pytań do gry i tablicę.
          Testowa i prawdziwa mogą działać równolegle – nic się nie miesza.
        </p>
        {error && <p className="ad-error" role="alert">{error}</p>}
        {!events && !error && <p>Wczytywanie…</p>}
        {events?.length === 0 && <p className="ad-muted">Nie ma jeszcze żadnej rozgrywki – kliknij „Nowa rozgrywka”.</p>}
        <ul className="ad-events">
          {events?.map((e) => <EventItem key={e.id} event={e} onChange={reload} />)}
        </ul>
      </section>
    </main>
  );
}

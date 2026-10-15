"use client";

import Link from "next/link";
import { useState } from "react";
import { apiJson, postJson, type ApiResult } from "@/lib/client/api";
import { useTwoStep } from "@/lib/client/useTwoStep";
import { ShareDialog } from "./ShareDialog";

export interface EventSummary {
  id: string;
  name: string;
  isTest: boolean;
  surveyOpen: boolean;
  createdAt: string;
  submissions: number;
  questions: number;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pl-PL");

/** Jedna rozgrywka na liście: nazwa (edytowalna), oznaczenia, liczniki, linki i akcje. */
export function EventItem({ event, onChange }: { event: EventSummary; onChange: () => Promise<void> }) {
  const [name, setName] = useState(event.name);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const base = `/api/admin/events/${event.id}`;

  async function run(request: () => Promise<ApiResult<unknown>>) {
    setBusy(true);
    const res = await request();
    setError(res.ok ? "" : res.error);
    await onChange();
    setBusy(false);
  }
  const rename = () => {
    const next = name.trim();
    if (next === "" || next === event.name) return setName(event.name);
    void run(() => postJson(base, { name: next }, "PATCH"));
  };
  const remove = useTwoStep(() => void run(() => apiJson(base, { method: "DELETE" })));

  return (
    <li className="ad-event">
      <div className="ad-event-main">
        <input
          aria-label="Nazwa rozgrywki" value={name} maxLength={100} disabled={busy}
          onChange={(e) => setName(e.target.value)} onBlur={rename}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
        <div className="ad-row">
          {event.isTest && <span className="ad-badge test">testowa</span>}
          <span className={event.surveyOpen ? "ad-badge ok" : "ad-badge off"}>{event.surveyOpen ? "ankieta otwarta" : "ankieta zamknięta"}</span>
          <span className="ad-muted">
            {event.submissions} ankiet · {event.questions} pytań · utworzona {formatDate(event.createdAt)}
          </span>
        </div>
        <EventLinks id={event.id} />
      </div>
      <div className="ad-row">
        <button type="button" className="danger" disabled={busy} onClick={remove.click}>
          {remove.armed ? `Usunąć razem z ${event.submissions} ankietami? Kliknij ponownie` : "Usuń"}
        </button>
      </div>
      {error && <p className="ad-error" role="alert">{error}</p>}
    </li>
  );
}

function EventLinks({ id }: { id: string }) {
  return (
    <div className="ad-row ad-event-links">
      <Link className="ad-link primary" href={`/admin/${id}`}>Otwórz panel</Link>
      <ShareDialog
        className="ad-link" label="Ankieta" path={`/ankieta/${id}`} screenPath={`/qr/${id}`}
        hint="Dla uczestników: zeskanuj kod albo wyślij link. „Kod na cały ekran” pokażesz na rzutniku."
      />
      <a className="ad-link" href={`/tablica/${id}`} target="_blank" rel="noreferrer">Tablica ↗</a>
    </div>
  );
}

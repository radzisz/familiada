"use client";

import { useState, type FormEvent } from "react";
import { postJson } from "@/lib/client/api";
import type { EventSummary } from "./EventItem";

/** Formularz nowej rozgrywki: nazwa, testowa czy prawdziwa, skąd pytania. Po utworzeniu otwiera jej panel. */
export function NewEventForm({ events, onCancel }: { events: EventSummary[]; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [isTest, setIsTest] = useState(false);
  const [questionsFrom, setQuestionsFrom] = useState("default");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await postJson<{ id: string }>("/api/admin/events", { name: name.trim(), isTest, questionsFrom });
    if (res.ok) return window.location.assign(`/admin/${res.data.id}`);
    setError(res.error);
    setBusy(false);
  }

  return (
    <form className="ad-new-event" onSubmit={(e) => void submit(e)} aria-label="Nowa rozgrywka">
      <h2>Nowa rozgrywka</h2>
      <label>
        <span>Nazwa</span>
        <input value={name} maxLength={100} required placeholder="np. Rekolekcje Kraków 2026" onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        <span>Pytania</span>
        <select value={questionsFrom} onChange={(e) => setQuestionsFrom(e.target.value)}>
          <option value="default">26 domyślnych pytań</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>skopiuj z: {ev.name} ({ev.questions} pytań)</option>
          ))}
          <option value="none">bez pytań (dodam sam)</option>
        </select>
      </label>
      <label className="ad-check">
        <input type="checkbox" checked={isTest} onChange={(e) => setIsTest(e.target.checked)} />
        testowa – można w niej dodawać losowe odpowiedzi i je czyścić
      </label>
      {error && <p className="ad-error" role="alert">{error}</p>}
      <div className="ad-dialog-actions">
        <button type="button" onClick={onCancel} disabled={busy}>Anuluj</button>
        <button type="submit" className="primary" disabled={busy || name.trim() === ""}>Utwórz rozgrywkę</button>
      </div>
    </form>
  );
}

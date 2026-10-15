"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { eventUrl } from "@/lib/client/eventUrl";
import { useTwoStep } from "@/lib/client/useTwoStep";
import { TestModeToggle } from "./TestDataPanel";
import type { Overview } from "./types";

type Target = "game" | "answers" | "questions";

interface ResetInfo {
  target: Target;
  label: string;
  description: (o: Overview) => string;
}

const RESETS: ResetInfo[] = [
  { target: "game", label: "Wyczyść stan gry", description: () => "Wynik, odkryte odpowiedzi i bieżąca runda wracają do początku. Pytania, odpowiedzi i wybór pytań do gry zostają." },
  { target: "answers", label: "Wyczyść odpowiedzi", description: (o) => `Usuwa ${o.counts.wife + o.counts.husband} ankiet i grupy odpowiedzi. Pytania i stan gry zostają.` },
  { target: "questions", label: "Wyczyść pytania", description: (o) => `Usuwa ${o.questions.length} pytań razem z ich odpowiedziami, wybór pytań do gry i stan gry.` },
];

/** Zakładka „Ustawienia”: tryb testowy i osobne czyszczenie stanu gry, odpowiedzi i pytań. */
export function SettingsTab({ overview, onChange }: { overview: Overview; onChange: () => Promise<void> }) {
  return (
    <section className="ad-panel ad-settings" aria-label="Ustawienia">
      <h2>Tryb testowy</h2>
      <p className="ad-muted">Pozwala generować losowe odpowiedzi do sprawdzenia grupowania i gry (zakładka „Odpowiedzi”).</p>
      <div className="ad-row">
        <TestModeToggle eventId={overview.event.id} isTest={overview.event.isTest} onChange={onChange} />
      </div>
      <h2>Czyszczenie</h2>
      <ul className="ad-resets">
        {RESETS.map((r) => <ResetRow key={r.target} info={r} overview={overview} onChange={onChange} />)}
      </ul>
    </section>
  );
}

function ResetRow({ info, overview, onChange }: { info: ResetInfo; overview: Overview; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function reset() {
    setBusy(true);
    const res = await postJson(eventUrl("/api/admin/reset", overview.event.id), { target: info.target });
    setError(res.ok ? "" : res.error);
    setMessage(res.ok ? "Wyczyszczono." : "");
    await onChange();
    setBusy(false);
  }
  const confirm = useTwoStep(() => void reset());

  return (
    <li className="ad-reset">
      <div>
        <b>{info.label}</b>
        <p className="ad-muted">{info.description(overview)}</p>
        {message && <span className="ad-msg" aria-live="polite">{message}</span>}
        {error && <p className="ad-error" role="alert">{error}</p>}
      </div>
      <button type="button" className="danger" disabled={busy} onClick={confirm.click}>
        {confirm.armed ? "Na pewno? Kliknij ponownie" : info.label}
      </button>
    </li>
  );
}

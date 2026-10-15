"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { GroupingPanel } from "./GroupingPanel";
import { LiveBar } from "./LiveBar";
import { PlanEditor } from "./PlanEditor";
import { QuestionList } from "./QuestionList";
import { useOverview } from "./useOverview";
import "./admin.css";

export function AdminApp() {
  const { overview, error, reload } = useOverview();
  const [selected, setSelected] = useState<string | null>(null);

  async function logout() {
    const res = await postJson("/api/logout", {});
    if (!res.ok) console.warn("[admin] logout failed", res.error);
    window.location.reload();
  }

  return (
    <main className="ad">
      <header className="ad-head">
        <h1>Familiada – panel prowadzącego</h1>
        <nav className="ad-nav">
          <a href="/tablica" target="_blank" rel="noreferrer">Tablica ↗</a>
          <a href="/qr" target="_blank" rel="noreferrer">Kod QR ↗</a>
          <a href="/api/admin/export" download>Eksport CSV</a>
          <button type="button" onClick={() => void logout()}>Wyloguj</button>
        </nav>
      </header>
      {error && <p className="ad-error" role="alert">{error}</p>}
      {!overview && !error && <p>Wczytywanie…</p>}
      {overview && (
        <>
          <LiveBar overview={overview} onChange={reload} />
          <div className="ad-grid">
            <QuestionList overview={overview} selected={selected} onSelect={setSelected} onChange={reload} />
            <section className="ad-panel ad-detail" aria-label="Grupowanie">
              {selected
                ? <GroupingPanel key={selected} questionId={selected} onChange={reload} />
                : <p className="ad-muted">Wybierz pytanie z listy, aby pogrupować odpowiedzi i zobaczyć wynik.</p>}
            </section>
          </div>
          <PlanEditor overview={overview} onChange={reload} />
        </>
      )}
    </main>
  );
}

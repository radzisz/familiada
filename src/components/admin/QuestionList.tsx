"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { eventUrl } from "@/lib/client/eventUrl";
import type { Audience } from "@/lib/types";
import { AudienceSelect } from "./AudienceSelect";
import { QuestionRow } from "./QuestionRow";
import type { Overview, OverviewQuestion } from "./types";

interface Props {
  overview: Overview;
  /** Akcje nad listą (otwieranie / zamykanie ankiety). */
  toolbar: React.ReactNode;
  onChange: () => Promise<void>;
}

/** Zakładka „Pytania”: definiowanie pytań ankiety (bez odpowiedzi i grupowania). */
export function QuestionList({ overview, toolbar, onChange }: Props) {
  const [error, setError] = useState("");
  const qs = overview.questions;

  async function run(promise: Promise<{ ok: boolean; error?: string }>) {
    const res = await promise;
    setError(res.ok ? "" : (res.error ?? "Błąd"));
    await onChange();
  }

  const move = (index: number, delta: number) => {
    const ids = qs.map((q) => q.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    void run(postJson(eventUrl("/api/admin/questions", overview.event.id), { ids }, "PUT"));
  };
  const patch = (q: OverviewQuestion, body: Partial<Pick<OverviewQuestion, "text" | "audience" | "hidden">>) =>
    run(postJson(eventUrl(`/api/admin/questions/${q.id}`, overview.event.id), body, "PATCH"));

  return (
    <section className="ad-panel ad-questions" aria-label="Pytania">
      <div className="ad-toolbar">
        <h2>Pytania w ankiecie ({qs.filter((q) => !q.hidden).length})</h2>
        <div className="ad-row">{toolbar}</div>
      </div>
      {error && <p className="ad-error" role="alert">{error}</p>}
      <ol className="ad-qlist">
        {qs.map((q, i) => (
          <QuestionRow
            key={q.id} q={q} index={i} last={i === qs.length - 1}
            onMove={(d) => move(i, d)} onPatch={(b) => patch(q, b)}
          />
        ))}
      </ol>
      <AddQuestion onAdd={(text, audience) => run(postJson(eventUrl("/api/admin/questions", overview.event.id), { text, audience }))} />
    </section>
  );
}

function AddQuestion({ onAdd }: { onAdd: (text: string, audience: Audience) => Promise<void> }) {
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  return (
    <form
      className="ad-add"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim() === "") return;
        void onAdd(text.trim(), audience).then(() => setText(""));
      }}
    >
      <label className="sr-only" htmlFor="newq">Nowe pytanie</label>
      <input id="newq" value={text} maxLength={200} onChange={(e) => setText(e.target.value)} placeholder="Nowe pytanie…" />
      <AudienceSelect value={audience} onChange={setAudience} />
      <button type="submit" disabled={text.trim() === ""}>Dodaj</button>
    </form>
  );
}

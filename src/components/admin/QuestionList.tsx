"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import type { Audience } from "@/lib/types";
import { AudienceSelect } from "./AudienceSelect";
import { QuestionRow } from "./QuestionRow";
import type { Overview, OverviewQuestion } from "./types";

interface Props {
  overview: Overview;
  selected: string | null;
  onSelect: (id: string) => void;
  onChange: () => Promise<void>;
}

/** Gdzie pytanie jest użyte w grze, np. „Runda 2” albo „Finał 3”. */
function planLabel(overview: Overview, id: string): string | null {
  const r = overview.plan.rounds.indexOf(id);
  if (r >= 0) return `Runda ${r + 1}`;
  const f = overview.plan.final.indexOf(id);
  return f >= 0 ? `Finał ${f + 1}` : null;
}

export function QuestionList({ overview, selected, onSelect, onChange }: Props) {
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
    void run(postJson("/api/admin/questions", { ids }, "PUT"));
  };
  const patch = (q: OverviewQuestion, body: Partial<Pick<OverviewQuestion, "text" | "audience" | "hidden">>) =>
    run(postJson(`/api/admin/questions/${q.id}`, body, "PATCH"));

  return (
    <section className="ad-panel" aria-label="Pytania">
      <h2>Pytania ({qs.filter((q) => !q.hidden).length})</h2>
      {error && <p className="ad-error" role="alert">{error}</p>}
      <ol className="ad-qlist">
        {qs.map((q, i) => (
          <QuestionRow
            key={q.id} q={q} index={i} last={i === qs.length - 1}
            selected={q.id === selected} plan={planLabel(overview, q.id)}
            onSelect={() => onSelect(q.id)} onMove={(d) => move(i, d)} onPatch={(b) => patch(q, b)}
          />
        ))}
      </ol>
      <AddQuestion onAdd={(text, audience) => run(postJson("/api/admin/questions", { text, audience }))} />
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

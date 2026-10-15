"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { eventUrl } from "@/lib/client/eventUrl";
import { moveItem } from "@/lib/reorder";
import { matchesQuestion, NO_FILTER, type QuestionFilter } from "@/lib/questionFilter";
import { AddQuestionDialog } from "./AddQuestionDialog";
import { QuestionFilterBar } from "./QuestionFilterBar";
import { QuestionRow } from "./QuestionRow";
import type { Overview, OverviewQuestion } from "./types";

interface Props {
  overview: Overview;
  onChange: () => Promise<void>;
}

/**
 * Kolejność pytań z przeciąganiem: w trakcie przeciągania lista pokazuje podgląd nowej kolejności,
 * po upuszczeniu zapisuje ją (`save`). `nudge` przesuwa o jedno miejsce (klawiatura na uchwycie).
 */
function useQuestionOrder(qs: OverviewQuestion[], save: (ids: readonly string[]) => Promise<void>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [preview, setPreview] = useState<readonly string[] | null>(null);
  const ids = qs.map((q) => q.id);
  const byId = new Map(qs.map((q) => [q.id, q]));
  const shown = (preview ?? ids).flatMap((id) => byId.get(id) ?? []);

  const commit = (next: readonly string[]) => {
    setPreview(next);
    void save(next).then(() => setPreview(null));
  };
  const over = (overId: string) => {
    const current = preview ?? ids;
    if (!dragId || dragId === overId) return;
    setPreview(moveItem(current, current.indexOf(dragId), current.indexOf(overId)));
  };
  const drop = () => {
    const changed = preview !== null && preview.some((id, i) => id !== ids[i]);
    setDragId(null);
    if (changed) commit(preview);
    else setPreview(null);
  };
  const nudge = (id: string, delta: number) => {
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    commit(moveItem(ids, from, to));
  };
  return { shown, dragId, start: setDragId, over, drop, nudge };
}

/** Zakładka „Pytania”: definiowanie pytań ankiety (bez odpowiedzi i grupowania). */
export function QuestionList({ overview, onChange }: Props) {
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<QuestionFilter>(NO_FILTER);
  const qs = overview.questions;

  async function run(promise: Promise<{ ok: boolean; error?: string }>): Promise<boolean> {
    const res = await promise;
    setError(res.ok ? "" : (res.error ?? "Błąd"));
    await onChange();
    return res.ok;
  }

  const order = useQuestionOrder(qs, async (ids) => {
    await run(postJson(eventUrl("/api/admin/questions", overview.event.id), { ids }, "PUT"));
  });
  const patch = async (q: OverviewQuestion, body: Partial<Pick<OverviewQuestion, "text" | "audience" | "hidden">>) => {
    await run(postJson(eventUrl(`/api/admin/questions/${q.id}`, overview.event.id), body, "PATCH"));
  };

  // Numer pytania zostaje jak w całej ankiecie, także gdy filtr część ukrywa.
  const visible = order.shown.map((q, i) => ({ q, i })).filter(({ q }) => matchesQuestion(q, filter));

  return (
    <section className="ad-panel ad-questions" aria-label="Pytania">
      <div className="ad-toolbar">
        <h2>Pytania w ankiecie ({qs.filter((q) => !q.hidden).length})</h2>
      </div>
      <QuestionFilterBar filter={filter} shown={visible.length} total={qs.length} onChange={setFilter} />
      {error && <p className="ad-error" role="alert">{error}</p>}
      <ol className="ad-qlist">
        {visible.length === 0 && <li className="ad-muted">Żadne pytanie nie pasuje do filtra.</li>}
        {visible.map(({ q, i }) => (
          <QuestionRow
            key={q.id} q={q} index={i} dragging={order.dragId === q.id}
            onDragStart={() => order.start(q.id)} onDragOver={() => order.over(q.id)} onDrop={order.drop}
            onNudge={(d) => order.nudge(q.id, d)} onPatch={(b) => patch(q, b)}
          />
        ))}
      </ol>
      <AddQuestionDialog onAdd={(text, audience) => run(postJson(eventUrl("/api/admin/questions", overview.event.id), { text, audience }))} />
    </section>
  );
}

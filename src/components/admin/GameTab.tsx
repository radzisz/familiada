"use client";

import { useCallback, useEffect, useState } from "react";
import type { AutoPlanMode, PlanCandidate } from "@/lib/autoplan";
import { apiJson, postJson } from "@/lib/client/api";
import { useTwoStep } from "@/lib/client/useTwoStep";
import { eventUrl } from "@/lib/client/eventUrl";
import { emptyPlan, type GamePlan } from "@/lib/types";
import { PlanEditor } from "./PlanEditor";
import type { Overview } from "./types";

/** Wyniki pytań do podglądu przy wyborze; odświeżane, gdy zmieni się liczba odpowiedzi lub plan. */
function useCandidates(overview: Overview) {
  const [candidates, setCandidates] = useState<Map<string, PlanCandidate>>(new Map());
  const [error, setError] = useState("");
  const statsKey = overview.questions.map((q) => `${q.answers}:${q.ungrouped}`).join(",");
  const reload = useCallback(async () => {
    const res = await apiJson<{ candidates: PlanCandidate[] }>(eventUrl("/api/admin/plan", overview.event.id));
    if (!res.ok) return setError(res.error);
    setError("");
    setCandidates(new Map(res.data.candidates.map((c) => [c.id, c])));
  }, [overview.event.id]);
  useEffect(() => {
    void reload();
  }, [reload, statsKey]);
  return { candidates, error, reload };
}

/** Zakładka „Przygotowanie do gry”: automatyczny wybór pytań i ręczne poprawki z podglądem tablicy. */
export function GameTab({ overview, onChange }: { overview: Overview; onChange: () => Promise<void> }) {
  const { candidates, error: loadError, reload } = useCandidates(overview);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(request: () => ReturnType<typeof postJson>) {
    setBusy(true);
    const res = await request();
    setError(res.ok ? "" : res.error);
    await Promise.all([onChange(), reload()]);
    setBusy(false);
  }
  const auto = (mode: AutoPlanMode) => void run(() => postJson(eventUrl("/api/admin/plan/auto", overview.event.id), { mode }));
  const save = (plan: GamePlan) => void run(() => postJson(eventUrl("/api/admin/plan", overview.event.id), plan, "PUT"));
  const redo = useTwoStep(() => auto("all"));
  const clear = useTwoStep(() => save(emptyPlan()));

  return (
    <section className="ad-panel" aria-label="Przygotowanie do gry">
      <h2>Wybór pytań do gry</h2>
      <p className="ad-muted">
        Automat wybiera do rund pytania z pełną tablicą (6 odpowiedzi, wysoka suma punktów), do rundy 2 pytanie
        dla mężów, do rundy 3 dla żon, a do finału pytania z wyraźnym liderem. Najpierw pogrupuj odpowiedzi.
      </p>
      <div className="ad-row ad-plan-tools">
        <button type="button" className="primary" disabled={busy} onClick={() => auto("fill")}>Uzupełnij puste automatycznie</button>
        <button type="button" disabled={busy} onClick={redo.click}>{redo.armed ? "Na pewno? Kliknij ponownie" : "Wybierz wszystko od nowa"}</button>
        <button type="button" disabled={busy} onClick={clear.click}>{clear.armed ? "Na pewno? Kliknij ponownie" : "Wyczyść wybór"}</button>
      </div>
      {(error || loadError) && <p className="ad-error" role="alert">{error || loadError}</p>}
      <PlanEditor overview={overview} candidates={candidates} busy={busy} onSave={save} />
    </section>
  );
}

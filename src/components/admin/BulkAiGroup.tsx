"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { eventUrl } from "@/lib/client/eventUrl";
import { useTwoStep } from "@/lib/client/useTwoStep";
import type { OverviewQuestion } from "./types";

// Ile pytań grupujemy naraz – każde wywołanie AI trwa kilkanaście sekund.
const PARALLEL = 4;

interface Props {
  eventId: string;
  questions: OverviewQuestion[];
  onDone: () => Promise<void>;
}

/** Grupuje z AI odpowiedzi wszystkich widocznych pytań jednym przyciskiem (po kilka pytań naraz). */
export function BulkAiGroup({ eventId, questions, onDone }: Props) {
  const targets = questions.filter((q) => !q.hidden && q.answers > 0);
  const [done, setDone] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function groupAll() {
    setMessage("");
    setError("");
    setDone(0);
    const failures = await runPool(targets, async (q) => {
      const res = await postJson(eventUrl(`/api/admin/questions/${q.id}/group`, eventId), { mode: "ai" });
      setDone((n) => (n ?? 0) + 1);
      return res.ok ? null : `${q.position}. ${res.error}`;
    });
    setDone(null);
    if (failures.length > 0) setError(`Nie udało się (${failures.length}): ${failures.join(" · ")}`);
    else setMessage(`Pogrupowano odpowiedzi w ${targets.length} pytaniach.`);
    await onDone();
  }
  const start = useTwoStep(() => void groupAll());
  const running = done !== null;

  return (
    <>
      <button type="button" className="primary" disabled={running || targets.length === 0} onClick={start.click}>
        {running ? `Grupuję… ${done}/${targets.length}`
          : start.armed ? "Kliknij ponownie – zastąpi ręczne zmiany w grupach"
          : "Pogrupuj odpowiedzi z AI"}
      </button>
      {message && <span className="ad-msg" aria-live="polite">{message}</span>}
      {error && <p className="ad-error" role="alert">{error}</p>}
    </>
  );
}

/** Wykonuje `task` dla każdego elementu, najwyżej PARALLEL naraz; zwraca komunikaty błędów. */
async function runPool<T>(items: T[], task: (item: T) => Promise<string | null>): Promise<string[]> {
  const failures: string[] = [];
  let next = 0;
  const worker = async () => {
    // Każdy worker bierze kolejne elementy; łącznie najwyżej items.length iteracji.
    for (let guard = 0; guard < items.length && next < items.length; guard++) {
      const item = items[next++]!;
      const failure = await task(item);
      if (failure) failures.push(failure);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, items.length) }, worker));
  return failures;
}

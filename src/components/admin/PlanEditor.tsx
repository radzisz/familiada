"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import type { GamePlan } from "@/lib/types";
import type { Overview } from "./types";

const ROUND_HINTS = [
  "ogólne (np. 23)",
  "mężowie o żonach (np. 16)",
  "żony o mężach (np. 11)",
  "o małżeństwie (np. 4) · punkty ×2",
  "na wesoło (np. 7) · punkty ×3",
];

/** Przypisanie pytań do rund 1–5 i 5 pytań finałowych. */
export function PlanEditor({ overview, onChange }: { overview: Overview; onChange: () => Promise<void> }) {
  const [error, setError] = useState("");
  const options = overview.questions.filter((q) => !q.hidden);

  async function save(plan: GamePlan) {
    const res = await postJson("/api/admin/plan", plan, "PUT");
    setError(res.ok ? "" : res.error);
    await onChange();
  }
  const setSlot = (kind: keyof GamePlan, index: number, value: string) => {
    const next = { rounds: [...overview.plan.rounds], final: [...overview.plan.final] };
    next[kind][index] = value === "" ? null : value;
    void save(next);
  };
  const select = (kind: keyof GamePlan, index: number, label: string) => (
    <select aria-label={label} value={overview.plan[kind][index] ?? ""} onChange={(e) => setSlot(kind, index, e.target.value)}>
      <option value="">— nie wybrano —</option>
      {options.map((q) => (
        <option key={q.id} value={q.id}>{q.position}. {q.text} ({q.answers} odp.)</option>
      ))}
    </select>
  );

  return (
    <section className="ad-panel" aria-label="Wybór do gry">
      <h2>Wybór pytań do gry</h2>
      {error && <p className="ad-error" role="alert">{error}</p>}
      <div className="ad-plan">
        <div>
          <h3>Rundy</h3>
          {ROUND_HINTS.map((hint, i) => (
            <label key={hint} className="ad-plan-row">
              <span>Runda {i + 1} <small>{hint}</small></span>
              {select("rounds", i, `Runda ${i + 1}`)}
            </label>
          ))}
        </div>
        <div>
          <h3>Finał <small>krótkie pytania z wyraźnym liderem</small></h3>
          {overview.plan.final.map((_, i) => (
            <label key={i} className="ad-plan-row">
              <span>Pytanie {i + 1}</span>
              {select("final", i, `Finał, pytanie ${i + 1}`)}
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

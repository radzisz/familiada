"use client";

import type { Overview, OverviewQuestion } from "./types";

interface Props {
  overview: Overview;
  selected: string | null;
  onSelect: (id: string) => void;
}

/** Stan odpowiedzi pytania: brak / niepogrupowane / pogrupowane. */
function status(q: OverviewQuestion): { text: string; cls: string } {
  if (q.answers === 0) return { text: "brak odpowiedzi", cls: "none" };
  if (q.ungrouped > 0) return { text: `niepogrupowane (${q.ungrouped})`, cls: "todo" };
  return { text: "pogrupowane", cls: "ok" };
}

/** Gdzie pytanie jest użyte w grze, np. „Runda 2” albo „Finał 3”. */
function planLabel(overview: Overview, id: string): string | null {
  const r = overview.plan.rounds.indexOf(id);
  if (r >= 0) return `Runda ${r + 1}`;
  const f = overview.plan.final.indexOf(id);
  return f >= 0 ? `Finał ${f + 1}` : null;
}

/** Zakładka „Odpowiedzi”: wybór pytania (tylko widoczne), liczba odpowiedzi i stan grupowania. */
export function AnswerQuestionList({ overview, selected, onSelect }: Props) {
  const visible = overview.questions.filter((q) => !q.hidden);
  return (
    <section className="ad-panel" aria-label="Pytania z odpowiedziami">
      <ol className="ad-qlist">
        {visible.map((q) => {
          const st = status(q);
          const plan = planLabel(overview, q.id);
          return (
            <li key={q.id} className={`ad-q pick${q.id === selected ? " sel" : ""}`}>
              <button type="button" className="ad-q-main" onClick={() => onSelect(q.id)} aria-pressed={q.id === selected}>
                <span className="ad-q-text">{q.position}. {q.text}</span>
                <span className="ad-q-meta">
                  <span>{q.answers} odp.</span>
                  <span className={`ad-st ${st.cls}`}>{st.text}</span>
                  {plan && <span className="ad-st plan">w grze: {plan}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

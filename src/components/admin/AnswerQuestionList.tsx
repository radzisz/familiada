"use client";

import { AUDIENCE_LABEL, type Overview, type OverviewQuestion } from "./types";

interface Props {
  overview: Overview;
  selected: string | null;
  onSelect: (id: string) => void;
  /** Zminimalizowana: wąski pasek z samymi numerami pytań. */
  collapsed: boolean;
  onToggle: () => void;
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
export function AnswerQuestionList({ overview, selected, onSelect, collapsed, onToggle }: Props) {
  const visible = overview.questions.filter((q) => !q.hidden);
  if (collapsed) return <QuestionRail questions={visible} selected={selected} onSelect={onSelect} onToggle={onToggle} />;
  return (
    <section className="ad-panel ad-qpanel" aria-label="Pytania z odpowiedziami">
      <div className="ad-qpanel-head">
        <span className="ad-muted">Pytania ({visible.length})</span>
        <button type="button" className="ad-collapse" aria-label="Zwiń listę pytań" title="Zwiń listę" onClick={onToggle}>«</button>
      </div>
      <ol className="ad-qlist">
        {visible.map((q) => {
          const st = status(q);
          const plan = planLabel(overview, q.id);
          return (
            <li key={q.id} className={`ad-q pick${q.id === selected ? " sel" : ""}`}>
              <button type="button" className="ad-q-main" onClick={() => onSelect(q.id)} aria-pressed={q.id === selected}>
                <span className="ad-q-text">{q.position}. {q.text}</span>
                <span className="ad-q-meta">
                  <span className={`ad-aud ${q.audience}`}>{AUDIENCE_LABEL[q.audience]}</span>
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

interface RailProps {
  questions: OverviewQuestion[];
  selected: string | null;
  onSelect: (id: string) => void;
  onToggle: () => void;
}

/** Zminimalizowana lista: wąski pasek z numerami pytań (kolor = stan grupowania) i „»” do rozwinięcia. */
function QuestionRail({ questions, selected, onSelect, onToggle }: RailProps) {
  return (
    <nav className="ad-panel ad-qrail" aria-label="Pytania (zwinięte)">
      <button type="button" className="ad-collapse" aria-label="Rozwiń listę pytań" title="Rozwiń listę" onClick={onToggle}>»</button>
      <ol>
        {questions.map((q) => (
          <li key={q.id}>
            <button
              type="button" className={`ad-qrail-n ${status(q).cls}${q.id === selected ? " sel" : ""}`}
              aria-pressed={q.id === selected} aria-label={`${q.position}. ${q.text}`} title={`${q.position}. ${q.text}`}
              onClick={() => onSelect(q.id)}
            >
              {q.position}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

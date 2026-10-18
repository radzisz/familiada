"use client";

import { useEffect, useState } from "react";
import { SurveyShell } from "@/components/survey/SurveyMessage";
import type { Branding } from "@/lib/branding";
import { postJson } from "@/lib/client/api";
import { readStorage, writeStorage } from "@/lib/client/storage";
import { OPINION_ANSWER_MAX, OPINION_SURVEY, scaleOf, type OpinionQuestion, type OpinionSection } from "@/lib/opinions";
import "./opinions.css";

type Phase = "intro" | "questions" | "sending" | "done";
type Answers = Record<string, string>;

interface Draft {
  answers: Answers;
  /** Numer bieżącego pytania (wśród wszystkich sekcji). */
  index: number;
}

interface Step {
  question: OpinionQuestion;
  section: OpinionSection;
  sectionNumber: number;
}

const STEPS: Step[] = OPINION_SURVEY.sections.flatMap((section, i) =>
  section.questions.map((question) => ({ question, section, sectionNumber: i + 1 })),
);
/** Po wybraniu oceny chwila na zobaczenie zaznaczenia, potem następne pytanie. */
const AUTO_NEXT_MS = 350;
const EMPTY: Draft = { answers: {}, index: 0 };
const draftKey = (retreat: string) => `opinie:draft:${retreat}`;

function loadDraft(retreat: string): Draft | null {
  const raw = readStorage(draftKey(retreat));
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<Draft>;
    const answers = typeof d.answers === "object" && d.answers ? d.answers : {};
    const index = Math.min(Math.max(0, Number(d.index) || 0), STEPS.length - 1);
    return { answers, index };
  } catch (err) {
    console.warn("[opinie] broken draft, starting over", err);
    return null;
  }
}

/** Jedno pytanie na ekranie, Wstecz / Dalej; szkic (odpowiedzi i miejsce) trzymany w telefonie do czasu wysłania. */
export function OpinionForm({ retreat, branding }: { retreat: string; branding: Branding }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [phase, setPhase] = useState<Phase>("intro");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = loadDraft(retreat);
    if (!saved) return;
    setDraft(saved);
    setPhase("questions");
  }, [retreat]);
  useEffect(() => {
    if (phase === "questions") writeStorage(draftKey(retreat), JSON.stringify(draft));
  }, [draft, phase, retreat]);

  async function send() {
    setPhase("sending");
    setError("");
    const res = await postJson("/api/opinie", { retreat, answers: draft.answers });
    if (!res.ok) {
      setError(res.error);
      return setPhase("questions");
    }
    writeStorage(draftKey(retreat), null);
    setPhase("done");
  }

  const goTo = (index: number) => {
    if (index < 0) return setPhase("intro");
    if (index >= STEPS.length) return void send();
    setDraft((d) => ({ ...d, index }));
  };
  const setAnswer = (id: string, value: string) =>
    setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: value.slice(0, OPINION_ANSWER_MAX) } }));

  if (phase === "intro") {
    return (
      <SurveyShell branding={branding} footer>
        <h1 className="sv-title">{OPINION_SURVEY.title}</h1>
        <p className="sv-step">{retreat}</p>
        <p className="sv-text">{OPINION_SURVEY.intro}</p>
        <button type="button" className="sv-btn primary" onClick={() => setPhase("questions")}>Zaczynamy</button>
      </SurveyShell>
    );
  }
  if (phase === "done") {
    return (
      <SurveyShell branding={branding} footer>
        <h1 className="sv-title">{OPINION_SURVEY.thanks}</h1>
      </SurveyShell>
    );
  }
  const index = draft.index;
  const step = STEPS[index];
  if (!step) return null;
  return (
    <SurveyShell branding={branding} footer={false}>
      <QuestionStep
        key={step.question.id} step={step} index={index} answers={draft.answers}
        sending={phase === "sending"} error={error} onAnswer={setAnswer} onGo={goTo}
      />
    </SurveyShell>
  );
}

interface StepProps {
  step: Step;
  index: number;
  answers: Answers;
  sending: boolean;
  error: string;
  onAnswer: (id: string, value: string) => void;
  onGo: (index: number) => void;
}

function QuestionStep({ step, index, answers, sending, error, onAnswer, onGo }: StepProps) {
  const { question: q, section } = step;
  const value = answers[q.id] ?? "";
  const isLast = index === STEPS.length - 1;
  const nextLabel = sending ? "Wysyłanie…" : isLast ? "Wyślij" : value.trim() ? "Dalej" : "Pomiń";

  const choose = (v: string) => {
    onAnswer(q.id, v);
    // Pierwszy wybór oceny przechodzi dalej sam; poprawka wcześniejszej odpowiedzi – nie.
    if (v !== "" && value === "" && !isLast) setTimeout(() => onGo(index + 1), AUTO_NEXT_MS);
  };

  return (
    <form
      className="op"
      onSubmit={(e) => {
        e.preventDefault();
        onGo(index + 1);
      }}
    >
      <div className="sv-progress" aria-hidden="true">
        <div className="sv-progress-bar" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
      </div>
      <p className="sv-step">{step.sectionNumber}. {section.title} · pytanie {index + 1} z {STEPS.length}</p>
      {section.lead && <p className="op-lead">{section.lead}</p>}
      <QuestionField q={q} value={value} onChange={choose} />
      {q.type === "scale" && (
        <p className="op-legend">1 – {OPINION_SURVEY.scaleMin}<br />5 – {OPINION_SURVEY.scaleMax}</p>
      )}
      {q.type === "nps" && <p className="op-legend">1 – {q.min}<br />10 – {q.max}</p>}
      {error && <p className="sv-error" role="alert">{error}</p>}
      <div className="sv-actions">
        <button type="button" className="sv-btn ghost" disabled={sending} onClick={() => onGo(index - 1)}>Wstecz</button>
        <button type="submit" className={`sv-btn ${value.trim() || isLast ? "primary" : "ghost"}`} disabled={sending}>
          {nextLabel}
        </button>
      </div>
    </form>
  );
}

function QuestionField({ q, value, onChange }: { q: OpinionQuestion; value: string; onChange: (value: string) => void }) {
  const id = `op-${q.id}`;
  if (q.type === "text") {
    return (
      <div className="op-field">
        <label htmlFor={id} className="op-question">{q.text}</label>
        <textarea
          id={id} className="sv-input op-textarea" value={value} maxLength={OPINION_ANSWER_MAX}
          onChange={(e) => onChange(e.target.value)} placeholder="(opcjonalnie)"
        />
      </div>
    );
  }
  const scale = scaleOf(q);
  const last = scale[scale.length - 1];
  return (
    <fieldset className="op-field">
      <legend className="op-question">{q.text}</legend>
      <div className={`op-scale${q.type === "nps" ? " nps" : ""}`}>
        {scale.map((o) => (
          <button
            key={o} type="button" aria-pressed={value === o}
            className={`op-option${value === o ? " on" : ""}`}
            onClick={() => onChange(value === o ? "" : o)}
          >
            {o === "1" && <Face mood="sad" />}
            {o}
            {o === last && <Face mood="happy" />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Buźka przy skrajnych ocenach: najniższa – smutna, najwyższa – uśmiechnięta. */
function Face({ mood }: { mood: "sad" | "happy" }) {
  const mouth = mood === "happy" ? "M8 14.5q4 3.5 8 0" : "M8 16.5q4 -3.5 8 0";
  return (
    <svg className="op-face" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="8.5" cy="9.5" r="1.4" fill="currentColor" />
      <circle cx="15.5" cy="9.5" r="1.4" fill="currentColor" />
      <path d={mouth} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

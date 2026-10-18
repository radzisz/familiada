"use client";

import { useEffect, useState } from "react";
import { SurveyFooter, SurveyShell } from "@/components/survey/SurveyMessage";
import type { Branding } from "@/lib/branding";
import { postJson } from "@/lib/client/api";
import { readStorage, writeStorage } from "@/lib/client/storage";
import { OPINION_ANSWER_MAX, OPINION_SURVEY, type OpinionQuestion, type OpinionSection } from "@/lib/opinions";
import "./opinions.css";

type Phase = "form" | "sending" | "done";
type Answers = Record<string, string>;

const SCALE = ["1", "2", "3", "4", "5"];
const draftKey = (retreat: string) => `opinie:draft:${retreat}`;

function loadDraft(retreat: string): Answers {
  const raw = readStorage(draftKey(retreat));
  if (!raw) return {};
  try {
    const d: unknown = JSON.parse(raw);
    return typeof d === "object" && d ? (d as Answers) : {};
  } catch (err) {
    console.warn("[opinie] broken draft, starting over", err);
    return {};
  }
}

/** Cała ankieta na jednej stronie; szkic trzymany w telefonie do czasu wysłania. */
export function OpinionForm({ retreat, branding }: { retreat: string; branding: Branding }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState("");

  useEffect(() => setAnswers(loadDraft(retreat)), [retreat]);
  const setAnswer = (id: string, value: string) =>
    setAnswers((a) => {
      const next = { ...a, [id]: value.slice(0, OPINION_ANSWER_MAX) };
      writeStorage(draftKey(retreat), JSON.stringify(next));
      return next;
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("sending");
    setError("");
    const res = await postJson("/api/opinie", { retreat, answers });
    if (!res.ok) {
      setError(res.error);
      return setPhase("form");
    }
    writeStorage(draftKey(retreat), null);
    setPhase("done");
  }

  if (phase === "done") {
    return (
      <SurveyShell branding={branding} footer>
        <h1 className="sv-title">{OPINION_SURVEY.thanks}</h1>
      </SurveyShell>
    );
  }

  return (
    // Stopka z logami na końcu przewijanej treści – stała zabierałaby miejsce na pytania.
    <SurveyShell branding={branding} footer={false}>
      <form className="op" onSubmit={submit}>
        <h1 className="sv-title">{OPINION_SURVEY.title}</h1>
        <p className="sv-step">{retreat}</p>
        <p className="sv-text">{OPINION_SURVEY.intro}</p>
        {OPINION_SURVEY.sections.map((s, i) => (
          <Section key={s.title} section={s} number={i + 1} answers={answers} onAnswer={setAnswer} />
        ))}
        {error && <p className="sv-error" role="alert">{error}</p>}
        <button type="submit" className="sv-btn primary" disabled={phase === "sending"}>
          {phase === "sending" ? "Wysyłanie…" : "Wyślij"}
        </button>
        <SurveyFooter branding={branding} />
      </form>
    </SurveyShell>
  );
}

interface SectionProps {
  section: OpinionSection;
  number: number;
  answers: Answers;
  onAnswer: (id: string, value: string) => void;
}

function Section({ section, number, answers, onAnswer }: SectionProps) {
  const hasScale = section.questions.some((q) => q.type === "scale");
  return (
    <section className="op-section">
      <h2 className="op-section-title">{number}. {section.title}</h2>
      {section.lead && <p className="op-lead">{section.lead}</p>}
      {hasScale && (
        <p className="op-legend">1 – {OPINION_SURVEY.scaleMin}<br />5 – {OPINION_SURVEY.scaleMax}</p>
      )}
      {section.questions.map((q) => (
        <QuestionField key={q.id} q={q} value={answers[q.id] ?? ""} onChange={(v) => onAnswer(q.id, v)} />
      ))}
    </section>
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
  return (
    <fieldset className="op-field">
      <legend className="op-question">{q.text}</legend>
      <div className="op-scale">
        {SCALE.map((o) => (
          <button
            key={o} type="button" aria-pressed={value === o}
            className={`op-option${value === o ? " on" : ""}`}
            onClick={() => onChange(value === o ? "" : o)}
          >
            {o === "1" && <Face mood="sad" />}
            {o}
            {o === "5" && <Face mood="happy" />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Buźka przy skrajnych ocenach: 1 – smutna, 5 – uśmiechnięta. */
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

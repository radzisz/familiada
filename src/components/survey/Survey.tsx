"use client";

import { useEffect, useMemo, useState } from "react";
import { postJson } from "@/lib/client/api";
import { getDeviceId, readStorage, writeStorage } from "@/lib/client/storage";
import { MAX_ANSWER_LENGTH, type Audience, type Role } from "@/lib/types";
import { SurveyShell } from "./SurveyMessage";
import { QuestionStep } from "./QuestionStep";

export interface SurveyQuestion {
  id: string;
  audience: Audience;
  text: string;
}

interface Draft {
  role: Role | null;
  answers: Record<string, string>;
  index: number;
}

type Phase = "loading" | "role" | "questions" | "sending" | "error" | "done" | "already";

const EMPTY: Draft = { role: null, answers: {}, index: 0 };
const doneKey = (eventId: string) => `familiada:done:${eventId}`;
const draftKey = (eventId: string) => `familiada:draft:${eventId}`;

function loadDraft(eventId: string): Draft {
  const raw = readStorage(draftKey(eventId));
  if (!raw) return EMPTY;
  try {
    const d = JSON.parse(raw) as Partial<Draft>;
    const role = d.role === "wife" || d.role === "husband" ? d.role : null;
    return { role, answers: typeof d.answers === "object" && d.answers ? d.answers : {}, index: Number(d.index) || 0 };
  } catch (err) {
    console.warn("[survey] broken draft, starting over", err);
    return EMPTY;
  }
}

/** Wysyła ankietę (jedno żądanie). Udany zapis czyści szkic i oznacza urządzenie jako „po ankiecie”. */
async function sendSurvey(eventId: string, draft: Draft, mine: SurveyQuestion[]): Promise<{ phase: Phase; error: string }> {
  const answers = mine
    .map((q) => ({ questionId: q.id, text: (draft.answers[q.id] ?? "").trim() }))
    .filter((a) => a.text !== "");
  if (answers.length === 0) return { phase: "error", error: "Wpisz przynajmniej jedną odpowiedź." };
  const res = await postJson("/api/submit", { eventId, deviceId: getDeviceId(), role: draft.role, answers });
  if (!res.ok && res.status !== 409) return { phase: "error", error: res.error };
  writeStorage(doneKey(eventId), "1");
  writeStorage(draftKey(eventId), null);
  return { phase: res.ok ? "done" : "already", error: "" };
}

/** Faza ankiety i szkic odpowiedzi, odtwarzane z localStorage i zapisywane do niego na bieżąco. */
function useSurveyDraft(eventId: string) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  useEffect(() => {
    if (readStorage(doneKey(eventId))) return setPhase("already");
    const saved = loadDraft(eventId);
    setDraft(saved);
    setPhase(saved.role ? "questions" : "role");
  }, [eventId]);
  useEffect(() => {
    if (phase === "questions" || phase === "error") writeStorage(draftKey(eventId), JSON.stringify(draft));
  }, [draft, phase, eventId]);
  return { phase, setPhase, draft, setDraft };
}

export function Survey({ eventId, questions }: { eventId: string; questions: SurveyQuestion[] }) {
  const { phase, setPhase, draft, setDraft } = useSurveyDraft(eventId);
  const [error, setError] = useState("");
  const mine = useMemo(
    () => questions.filter((q) => q.audience === "all" || q.audience === draft.role),
    [questions, draft.role],
  );

  async function send() {
    setPhase("sending");
    const result = await sendSurvey(eventId, draft, mine);
    setError(result.error);
    setPhase(result.phase);
  }

  const chooseRole = (role: Role) => {
    setDraft((d) => ({ ...d, role, index: 0 }));
    setPhase("questions");
  };
  const goTo = (index: number) => {
    if (index < 0) return setPhase("role");
    if (index >= mine.length) return void send();
    setDraft((d) => ({ ...d, index }));
  };
  const setAnswer = (id: string, text: string) =>
    setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: text.slice(0, MAX_ANSWER_LENGTH) } }));

  return (
    <SurveyShell>
      <SurveyBody
        phase={phase} draft={draft} mine={mine} error={error}
        onRole={chooseRole} onGo={goTo} onAnswer={setAnswer} onRetry={() => void send()}
        onBack={() => setPhase("questions")}
      />
    </SurveyShell>
  );
}

interface BodyProps {
  phase: Phase;
  draft: Draft;
  mine: SurveyQuestion[];
  error: string;
  onRole: (role: Role) => void;
  onGo: (index: number) => void;
  onAnswer: (id: string, text: string) => void;
  onRetry: () => void;
  onBack: () => void;
}

function SurveyBody(p: BodyProps) {
  switch (p.phase) {
    case "loading": return <p className="sv-text">Wczytywanie…</p>;
    case "role": return <RoleStep onRole={p.onRole} />;
    case "sending": return <p className="sv-text" aria-live="polite">Wysyłanie odpowiedzi…</p>;
    case "done": return <Thanks title="Dziękujemy!" />;
    case "already": return <Thanks title="Już odpowiedziałeś, dziękujemy!" />;
    case "error": return <ErrorStep error={p.error} onRetry={p.onRetry} onBack={p.onBack} />;
    case "questions": {
      const index = Math.min(p.draft.index, Math.max(0, p.mine.length - 1));
      const q = p.mine[index];
      if (!q) return <p className="sv-text">Brak pytań w ankiecie.</p>;
      return (
        <QuestionStep
          key={q.id} index={index} total={p.mine.length} text={q.text}
          value={p.draft.answers[q.id] ?? ""} onChange={(t) => p.onAnswer(q.id, t)} onGo={p.onGo}
        />
      );
    }
  }
}

function RoleStep({ onRole }: { onRole: (role: Role) => void }) {
  return (
    <>
      <h1 className="sv-title">Kim jesteś?</h1>
      <p className="sv-text">Ankieta jest anonimowa. Odpowiadaj krótko – jednym lub dwoma słowami.</p>
      <div className="sv-roles">
        <button type="button" className="sv-role" onClick={() => onRole("wife")}>Żona</button>
        <button type="button" className="sv-role" onClick={() => onRole("husband")}>Mąż</button>
      </div>
    </>
  );
}

function Thanks({ title }: { title: string }) {
  return (
    <>
      <h1 className="sv-title">{title}</h1>
      <p className="sv-text">Wyniki zobaczysz wieczorem na Familiadzie.</p>
    </>
  );
}

function ErrorStep({ error, onRetry, onBack }: { error: string; onRetry: () => void; onBack: () => void }) {
  return (
    <>
      <h1 className="sv-title">Nie udało się wysłać</h1>
      <p className="sv-error" role="alert">{error}</p>
      <p className="sv-text">Twoje odpowiedzi są zapisane w telefonie – nic nie zginęło.</p>
      <div className="sv-actions">
        <button type="button" className="sv-btn ghost" onClick={onBack}>Wróć do pytań</button>
        <button type="button" className="sv-btn primary" onClick={onRetry}>Spróbuj ponownie</button>
      </div>
    </>
  );
}

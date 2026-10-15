"use client";

import { useState } from "react";
import { AnswerQuestionList } from "./AnswerQuestionList";
import { BulkAiGroup } from "./BulkAiGroup";
import { GenerateAnswersDialog } from "./GenerateAnswersDialog";
import { GroupingPanel } from "./GroupingPanel";
import { Counts } from "./LiveBar";
import type { Overview } from "./types";

interface Props {
  overview: Overview;
  selected: string | null;
  /** Zmiana wymusza ponowne wczytanie otwartego pytania (np. po zbiorczym grupowaniu). */
  revision: number;
  /** Otwieranie / zamykanie ankiety – tu, bo dotyczy zbierania odpowiedzi. */
  surveyToggle: React.ReactNode;
  onSelect: (id: string | null) => void;
  onChange: () => Promise<void>;
  onRegrouped: () => Promise<void>;
}

/** Puste (bez odpowiedzi) widoczne pytania – tylko w trybie testowym, gdzie można je wygenerować. */
const emptyQuestionIds = (o: Overview) =>
  o.event.isTest ? o.questions.filter((q) => !q.hidden && q.answers === 0).map((q) => q.id) : null;

/** Zakładka „Odpowiedzi”: liczniki, grupowanie z AI i generowanie (akcje), lista pytań i grupy wybranego. */
export function AnswersTab({ overview, selected, revision, surveyToggle, onSelect, onChange, onRegrouped }: Props) {
  const { id, isTest } = overview.event;
  const [listOpen, setListOpen] = useState(true);
  const visibleIds = overview.questions.filter((q) => !q.hidden).map((q) => q.id);
  return (
    <>
      <section className="ad-panel ad-toolbar" aria-label="Akcje odpowiedzi">
        <Counts counts={overview.counts} />
        <div className="ad-row">
          {surveyToggle}
          <BulkAiGroup eventId={id} questions={overview.questions} onDone={onRegrouped} />
          {isTest && (
            <GenerateAnswersDialog eventId={id} label="Wygeneruj testowe odpowiedzi" scope="wszystkich pytań" onDone={onRegrouped} />
          )}
        </div>
      </section>
      <div className={`ad-grid${listOpen ? "" : " list-closed"}`}>
        <AnswerQuestionList
          overview={overview} selected={selected} onSelect={onSelect}
          collapsed={!listOpen} onToggle={() => setListOpen((o) => !o)}
        />
        <section className="ad-panel ad-detail" aria-label="Grupowanie">
          <div className="ad-detail-body">
            {selected
              ? (
                <GroupingPanel
                  key={`${selected}-${revision}`} eventId={id} questionId={selected}
                  emptyQuestionIds={emptyQuestionIds(overview)} onChange={onChange}
                />
              )
              : <p className="ad-muted">Wybierz pytanie z listy, aby zobaczyć i poprawić grupy odpowiedzi.</p>}
          </div>
          {!listOpen && <QuestionStepper ids={visibleIds} selected={selected} onSelect={onSelect} />}
        </section>
      </div>
    </>
  );
}

/** Przy zwiniętej liście: „Poprzednie / Następne” pytanie, przyklejone do dołu boksu odpowiedzi. */
function QuestionStepper({ ids, selected, onSelect }: { ids: string[]; selected: string | null; onSelect: (id: string) => void }) {
  const index = selected ? ids.indexOf(selected) : -1;
  const go = (i: number) => {
    const id = ids[i];
    if (id) onSelect(id);
  };
  return (
    <nav className="ad-stepper" aria-label="Przechodzenie między pytaniami">
      <button type="button" disabled={index <= 0} onClick={() => go(index - 1)}>← Poprzednie</button>
      <span className="ad-muted">{index >= 0 ? `${index + 1} / ${ids.length}` : `– / ${ids.length}`}</span>
      <button type="button" className="primary" disabled={index >= ids.length - 1} onClick={() => go(index + 1)}>Następne →</button>
    </nav>
  );
}

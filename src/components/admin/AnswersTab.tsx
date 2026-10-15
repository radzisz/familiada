"use client";

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
  onSelect: (id: string | null) => void;
  onChange: () => Promise<void>;
  onRegrouped: () => Promise<void>;
}

/** Puste (bez odpowiedzi) widoczne pytania – tylko w trybie testowym, gdzie można je wygenerować. */
const emptyQuestionIds = (o: Overview) =>
  o.event.isTest ? o.questions.filter((q) => !q.hidden && q.answers === 0).map((q) => q.id) : null;

/** Zakładka „Odpowiedzi”: liczniki, grupowanie z AI i generowanie (akcje), lista pytań i grupy wybranego. */
export function AnswersTab({ overview, selected, revision, onSelect, onChange, onRegrouped }: Props) {
  const { id, isTest } = overview.event;
  return (
    <>
      <section className="ad-panel ad-toolbar" aria-label="Akcje odpowiedzi">
        <Counts counts={overview.counts} />
        <div className="ad-row">
          <BulkAiGroup eventId={id} questions={overview.questions} onDone={onRegrouped} />
          {isTest && (
            <GenerateAnswersDialog eventId={id} label="Wygeneruj testowe odpowiedzi" scope="wszystkich pytań" onDone={onRegrouped} />
          )}
        </div>
      </section>
      <div className="ad-grid">
        <AnswerQuestionList overview={overview} selected={selected} onSelect={onSelect} />
        <section className="ad-panel ad-detail" aria-label="Grupowanie">
          {selected
            ? (
              <GroupingPanel
                key={`${selected}-${revision}`} eventId={id} questionId={selected}
                emptyQuestionIds={emptyQuestionIds(overview)} onChange={onChange}
              />
            )
            : <p className="ad-muted">Wybierz pytanie z listy, aby zobaczyć i poprawić grupy odpowiedzi.</p>}
        </section>
      </div>
    </>
  );
}

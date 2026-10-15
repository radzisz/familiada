"use client";

import { GenerateAnswersDialog } from "./GenerateAnswersDialog";

interface Props {
  eventId: string;
  questionId: string;
  /** Puste pytania rozgrywki testowej; null = rozgrywka prawdziwa (bez generowania). */
  emptyQuestionIds: string[] | null;
  onGenerated: () => Promise<void>;
}

/** Pytanie bez odpowiedzi: w trybie testowym proponuje wygenerowanie odpowiedzi dla niego albo dla wszystkich pustych. */
export function EmptyQuestion({ eventId, questionId, emptyQuestionIds, onGenerated }: Props) {
  if (!emptyQuestionIds) {
    return <p className="ad-muted">Nikt jeszcze nie odpowiedział na to pytanie.</p>;
  }
  return (
    <div className="ad-empty">
      <p>Brak odpowiedzi. Wygenerować testowe?</p>
      <div className="ad-row">
        <GenerateAnswersDialog
          eventId={eventId} label="Dla tego pytania" scope="tego pytania"
          questionIds={[questionId]} primary onDone={onGenerated}
        />
        <GenerateAnswersDialog
          eventId={eventId} label={`Dla wszystkich pustych pytań (${emptyQuestionIds.length})`}
          scope={`${emptyQuestionIds.length} pustych pytań`} questionIds={emptyQuestionIds}
          disabled={emptyQuestionIds.length === 0} onDone={onGenerated}
        />
      </div>
    </div>
  );
}

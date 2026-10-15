import { Survey, type SurveyQuestion } from "@/components/survey/Survey";
import { SurveyMessage } from "@/components/survey/SurveyMessage";
import { serviceClient } from "@/lib/server/db";
import { fetchActiveEvent, type EventRow } from "@/lib/server/repo/events";
import { fetchQuestions } from "@/lib/server/repo/questions";

export const dynamic = "force-dynamic";

async function loadSurvey(): Promise<{ event: EventRow | null; questions: SurveyQuestion[] }> {
  const db = serviceClient();
  const event = await fetchActiveEvent(db);
  if (!event) return { event: null, questions: [] };
  const questions = (await fetchQuestions(db, event.id))
    .filter((q) => !q.hidden)
    .map((q) => ({ id: q.id, audience: q.audience, text: q.text }));
  return { event, questions };
}

export default async function SurveyPage() {
  let data: Awaited<ReturnType<typeof loadSurvey>>;
  try {
    data = await loadSurvey();
  } catch (err) {
    console.error("[survey page]", err);
    return <SurveyMessage title="Coś poszło nie tak" text="Nie udało się wczytać ankiety. Odśwież stronę za chwilę." />;
  }
  if (!data.event) return <SurveyMessage title="Jeszcze chwila" text="Ankieta nie jest jeszcze gotowa." />;
  if (!data.event.survey_open) {
    return <SurveyMessage title="Ankieta zamknięta" text="Dziękujemy! Wyniki zobaczysz wieczorem na Familiadzie." />;
  }
  return <Survey eventId={data.event.id} questions={data.questions} />;
}

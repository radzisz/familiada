import { Survey, type SurveyQuestion } from "@/components/survey/Survey";
import { SurveyMessage } from "@/components/survey/SurveyMessage";
import { serviceClient } from "@/lib/server/db";
import { fetchEventForPage } from "@/lib/server/pageEvent";
import type { EventRow } from "@/lib/server/repo/events";
import { fetchQuestions } from "@/lib/server/repo/questions";

export const dynamic = "force-dynamic";

async function loadSurvey(id: string): Promise<{ event: EventRow | null; questions: SurveyQuestion[] }> {
  const event = await fetchEventForPage(id);
  if (!event) return { event: null, questions: [] };
  const questions = (await fetchQuestions(serviceClient(), event.id))
    .filter((q) => !q.hidden)
    .map((q) => ({ id: q.id, audience: q.audience, text: q.text }));
  return { event, questions };
}

/** Ankieta jednej rozgrywki – link z kodu QR (`/ankieta/<id>`). */
export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  let data: Awaited<ReturnType<typeof loadSurvey>>;
  try {
    data = await loadSurvey((await params).id);
  } catch (err) {
    console.error("[survey page]", err);
    return <SurveyMessage title="Coś poszło nie tak" text="Nie udało się wczytać ankiety. Odśwież stronę za chwilę." />;
  }
  if (!data.event) return <SurveyMessage title="Nie ma takiej ankiety" text="Sprawdź link albo zeskanuj kod QR jeszcze raz." />;
  if (!data.event.survey_open) {
    return <SurveyMessage title="Ankieta zamknięta" text="Dziękujemy! Wyniki zobaczysz wieczorem na Familiadzie." />;
  }
  return <Survey eventId={data.event.id} questions={data.questions} />;
}

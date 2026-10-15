import { Survey, type SurveyQuestion } from "@/components/survey/Survey";
import { SurveyMessage } from "@/components/survey/SurveyMessage";
import { serviceClient } from "@/lib/server/db";
import { fetchEventForPage } from "@/lib/server/pageEvent";
import type { Branding } from "@/lib/branding";
import { brandingOf, type EventRow } from "@/lib/server/repo/events";
import { fetchQuestions } from "@/lib/server/repo/questions";

export const dynamic = "force-dynamic";

interface SurveyData {
  event: EventRow | null;
  questions: SurveyQuestion[];
  branding: Branding | null;
}

async function loadSurvey(id: string): Promise<SurveyData> {
  const event = await fetchEventForPage(id);
  if (!event) return { event: null, questions: [], branding: null };
  const all = await fetchQuestions(serviceClient(), event.id);
  const questions = all.filter((q) => !q.hidden).map((q) => ({ id: q.id, audience: q.audience, text: q.text }));
  return { event, questions, branding: brandingOf(event) };
}

/** Ankieta jednej rozgrywki – link z kodu QR (`/ankieta/<id>`). */
export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  let data: SurveyData;
  try {
    data = await loadSurvey((await params).id);
  } catch (err) {
    console.error("[survey page]", err);
    return <SurveyMessage title="Coś poszło nie tak" text="Nie udało się wczytać ankiety. Odśwież stronę za chwilę." />;
  }
  if (!data.event || !data.branding) return <SurveyMessage title="Nie ma takiej ankiety" text="Sprawdź link albo zeskanuj kod QR jeszcze raz." />;
  if (!data.event.survey_open) {
    return <SurveyMessage title="Ankieta zamknięta" text="Dziękujemy! Wyniki zobaczysz wieczorem na Familiadzie." branding={data.branding} />;
  }
  return <Survey eventId={data.event.id} questions={data.questions} branding={data.branding} />;
}

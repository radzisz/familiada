import { z } from "zod";

/**
 * Opinie o rekolekcjach – treść ankiety. Jedyne miejsce do edycji pytań; `id` musi być stałe
 * (po nim łączą się odpowiedzi przy opracowaniu), treść można poprawiać.
 */

export type OpinionQuestion =
  | { id: string; type: "scale"; text: string }
  /** Net Promoter Score na skali 1–10: polecający 9–10, krytycy 1–6. */
  | { id: string; type: "nps"; text: string; min: string; max: string }
  | { id: string; type: "text"; text: string };

export interface OpinionSection {
  title: string;
  /** Pytanie przewodnie nad pytaniami sekcji. */
  lead?: string;
  questions: OpinionQuestion[];
}

const scale = (id: string, text: string): OpinionQuestion => ({ id, type: "scale", text });

export const OPINION_SURVEY = {
  title: "Jedność małżeńska a finanse",
  /** Domyślne rekolekcje, gdy link nie ma `?r=`. */
  retreat: "Karczówka, październik 2026",
  intro: "Dziękujemy, że byliście z nami. Ankieta jest anonimowa i zajmie około 3 minut.",
  thanks: "Dziękujemy! Monika i Dominik",
  contact: {
    title: "Zostańmy w kontakcie",
    text: "Jeśli chcecie, zostawcie nam jeszcze kontakt – napiszemy o kolejnych rekolekcjach. To zupełnie opcjonalne.",
    anonymity: "Wasze odpowiedzi w ankiecie pozostają anonimowe. Kontakt zapisujemy osobno i nie łączymy go z nimi.",
    consent:
      "Wyrażam zgodę na przetwarzanie moich danych osobowych (imię i nazwisko, adres e-mail) przez Fundację YoungTree " +
      "z siedzibą w Krakowie w celu utrzymania kontaktu, w tym informowania o kolejnych rekolekcjach i wydarzeniach. " +
      "Zgodę mogę w każdej chwili wycofać.",
  },
  scaleMin: "zdecydowanie nie / bardzo słabo",
  scaleMax: "zdecydowanie tak / bardzo dobrze",
  sections: [
    {
      title: "Nasze wykłady",
      lead: "Na ile każdy wykład był dla Was wartościowy?",
      questions: [
        scale("w1", "Właściciel czy zarządca?"),
        scale("w2", "Praca a jedność małżeńska"),
        scale("w3", "Niewola finansowa"),
        scale("w4", "Dawanie"),
        scale("w5", "Wychowanie do odpowiedzialności w sferze finansów"),
        scale("w6", "Dziecięce finanse"),
      ],
    },
    {
      title: "Sposób prowadzenia",
      questions: [
        scale("p1", "Treść była zrozumiała i dobrze uporządkowana"),
        scale("p2", "Wykłady dawały praktyczne wskazówki do zastosowania w domu"),
        scale("p3", "Świadectwa i przykłady z życia prowadzących były pomocne"),
        scale("p4", "Pytania do dialogu pomogły nam porozmawiać we dwoje"),
        scale("p5", "Długość wykładów była odpowiednia"),
      ],
    },
    {
      title: "Familiada małżeńska (sobota wieczór)",
      questions: [
        scale("f1", "Familiada jako całość"),
        scale("f2", "Dobrze się bawiliśmy i lepiej poznaliśmy inne małżeństwa"),
        scale("f4", "Ankieta z kodem QR przed grą była prosta do wypełnienia"),
      ],
    },
    {
      title: "Wasze przeżycia",
      questions: [
        scale("r1", "Rozmawialiśmy o pieniądzach szczerzej niż zwykle"),
        scale("r2", "Dowiedziałem/am się czegoś nowego o współmałżonku"),
        scale("r3", "Czujemy się bardziej jednością w sprawach finansowych"),
        scale("r4", "Pogłębiła się moja relacja z Bogiem w tej sferze życia"),
        scale("r5", "Wyjeżdżamy z konkretnym postanowieniem"),
      ],
    },
    {
      title: "Pytania otwarte",
      questions: [
        { id: "o1", type: "text", text: "Co przeżyliście podczas rekolekcji i co zabieracie do domu? (moment, myśl, rozmowa, decyzja)" },
        { id: "o2", type: "text", text: "Co w naszych wykładach poprawić, rozwinąć albo skrócić?" },
      ],
    },
    {
      title: "Ogólna ocena",
      questions: [
        {
          id: "nps", type: "nps", text: "Na ile prawdopodobne jest, że polecicie te rekolekcje znajomym?",
          min: "zupełnie nieprawdopodobne", max: "na pewno polecimy",
        },
      ],
    },
  ] satisfies OpinionSection[],
};

export const OPINION_QUESTIONS: OpinionQuestion[] = OPINION_SURVEY.sections.flatMap((s) => s.questions);

export const OPINION_ANSWER_MAX = 2000;
export const RETREAT_MAX = 100;

export const CONTACT_NAME_MAX = 120;
export const CONTACT_EMAIL_MAX = 200;

export interface OpinionContact {
  name: string;
  email: string;
  consent: boolean;
}

/** Kontakt wymaga poprawnego e-maila i zgody (imię i nazwisko opcjonalne). Zwraca błąd albo null. */
export function contactError(c: OpinionContact): string | null {
  if (!z.email().safeParse(c.email.trim()).success) return "Wpiszcie poprawny adres e-mail.";
  if (!c.consent) return "Zaznaczcie zgodę na przetwarzanie danych.";
  return null;
}

export const OpinionContactSchema = z.object({
  retreat: z.string().trim().max(RETREAT_MAX).nullable(),
  name: z.string().max(CONTACT_NAME_MAX),
  email: z.string().max(CONTACT_EMAIL_MAX),
  consent: z.boolean(),
});

export const OpinionSubmitSchema = z.object({
  retreat: z.string().trim().max(RETREAT_MAX).nullable(),
  answers: z.record(z.string(), z.string().max(OPINION_ANSWER_MAX)),
});

export interface StoredAnswer {
  id: string;
  question: string;
  answer: string;
}

/** Możliwe oceny pytania zamkniętego (puste dla pytań otwartych). */
export function scaleOf(q: OpinionQuestion): string[] {
  if (q.type === "text") return [];
  const max = q.type === "nps" ? 10 : 5;
  return Array.from({ length: max }, (_, i) => String(i + 1));
}

const isValid = (q: OpinionQuestion, value: string) => q.type === "text" || scaleOf(q).includes(value);

/** NPS = % polecających (9–10) − % krytyków (1–6), zaokrąglony; null bez odpowiedzi. */
export function npsScore(values: number[]): number | null {
  if (values.length === 0) return null;
  const promoters = values.filter((v) => v >= 9).length;
  const detractors = values.filter((v) => v <= 6).length;
  return Math.round(((promoters - detractors) / values.length) * 100);
}

/** Odpowiedzi w kolejności pytań, z treścią pytania; puste i niepasujące do pytania są pomijane. */
export function prepareOpinion(answers: Record<string, string>): StoredAnswer[] {
  return OPINION_QUESTIONS.flatMap((q) => {
    const answer = (answers[q.id] ?? "").trim();
    return answer !== "" && isValid(q, answer) ? [{ id: q.id, question: q.text, answer }] : [];
  });
}

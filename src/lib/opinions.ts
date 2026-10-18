import { z } from "zod";

/**
 * Opinie o rekolekcjach – treść ankiety. Jedyne miejsce do edycji pytań; `id` musi być stałe
 * (po nim łączą się odpowiedzi przy opracowaniu), treść można poprawiać.
 */

export type OpinionQuestion =
  | { id: string; type: "scale"; text: string }
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
        scale("f3", "Pytania były trafne i zabawne"),
        scale("f4", "Ankieta z kodem QR przed grą była prosta do wypełnienia"),
        scale("f5", "Prowadzenie i tempo gry"),
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
  ] satisfies OpinionSection[],
};

export const OPINION_QUESTIONS: OpinionQuestion[] = OPINION_SURVEY.sections.flatMap((s) => s.questions);

export const OPINION_ANSWER_MAX = 2000;
export const RETREAT_MAX = 100;

export const OpinionSubmitSchema = z.object({
  retreat: z.string().trim().max(RETREAT_MAX).nullable(),
  answers: z.record(z.string(), z.string().max(OPINION_ANSWER_MAX)),
});

export interface StoredAnswer {
  id: string;
  question: string;
  answer: string;
}

const isValid = (q: OpinionQuestion, value: string) => q.type === "text" || /^[1-5]$/.test(value);

/** Odpowiedzi w kolejności pytań, z treścią pytania; puste i niepasujące do pytania są pomijane. */
export function prepareOpinion(answers: Record<string, string>): StoredAnswer[] {
  return OPINION_QUESTIONS.flatMap((q) => {
    const answer = (answers[q.id] ?? "").trim();
    return answer !== "" && isValid(q, answer) ? [{ id: q.id, question: q.text, answer }] : [];
  });
}

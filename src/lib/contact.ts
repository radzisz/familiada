import { z } from "zod";

/** Formularz „Napisz do nas” ze strony Animatorni – zapytania zapisywane w `contact_requests`. */

export const CONTACT_TOPICS = [
  { value: "familiada", label: "Familiada" },
  { value: "ankiety", label: "Ankiety i opinie" },
  { value: "spiewnik", label: "Śpiewnik" },
  { value: "pakiet", label: "Kilka narzędzi na jedno wydarzenie" },
  { value: "narzedzie", label: "Zgłoszenie narzędzia do katalogu" },
  { value: "wspolpraca", label: "Współpraca" },
  { value: "inne", label: "Coś innego" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];

export const CONTACT_CONSENT =
  "Wyrażam zgodę na przetwarzanie podanych danych przez operatora serwisu w celu odpowiedzi na moje zapytanie. " +
  "Zgodę mogę w każdej chwili wycofać.";

export const CONTACT_LIMITS = { name: 120, email: 200, organization: 160, message: 3000, source: 60 } as const;

export const ContactRequestSchema = z.object({
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [ContactTopic, ...ContactTopic[]]),
  name: z.string().max(CONTACT_LIMITS.name),
  email: z.string().max(CONTACT_LIMITS.email),
  organization: z.string().max(CONTACT_LIMITS.organization),
  message: z.string().max(CONTACT_LIMITS.message),
  consent: z.boolean(),
  /** Strona, z której wysłano (np. „familiada”) – do statystyk, nie do wyświetlania. */
  source: z.string().max(CONTACT_LIMITS.source),
  /** Pułapka na boty: pole ukryte przed ludźmi, musi zostać puste. */
  website: z.string().max(200),
});

export type ContactRequest = z.infer<typeof ContactRequestSchema>;

export function contactRequestError(c: ContactRequest): string | null {
  if (!z.email().safeParse(c.email.trim()).success) return "Wpisz poprawny adres e-mail.";
  if (!c.consent) return "Zaznacz zgodę na przetwarzanie danych.";
  return null;
}

export function isBot(c: ContactRequest): boolean {
  return c.website.trim() !== "";
}

export function topicLabel(value: string): string {
  return CONTACT_TOPICS.find((t) => t.value === value)?.label ?? value;
}

/** Zgłoszenie narzędzia do katalogu (`/wspolpraca`) – zapisywane jako zapytanie z tematem „narzedzie”. */
export interface ToolSubmission {
  toolName: string;
  url: string;
  category: string;
  /** Autor zgłasza własne narzędzie albo poleca cudze. */
  own: boolean;
  description: string;
}

export function toolSubmissionError(t: ToolSubmission): string | null {
  if (!t.toolName.trim()) return "Wpisz nazwę narzędzia.";
  return null;
}

export function toolSubmissionMessage(t: ToolSubmission): string {
  const lines = [
    `Narzędzie: ${t.toolName.trim()}`,
    t.url.trim() && `Adres: ${t.url.trim()}`,
    t.category && `Kategoria: ${t.category}`,
    t.own ? "Zgłasza autor narzędzia" : "Polecenie cudzego narzędzia",
    t.description.trim() && `\n${t.description.trim()}`,
  ];
  return lines.filter(Boolean).join("\n").slice(0, CONTACT_LIMITS.message);
}

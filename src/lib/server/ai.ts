import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { assert } from "@/lib/assert";
import type { PlannedGroup, UniqueAnswer } from "@/lib/grouping";
import { env } from "./env";

const GroupingSchema = z.object({
  groups: z.array(z.object({ label: z.string(), members: z.array(z.string()) })),
});

const SYSTEM = `Grupujesz odpowiedzi z ankiety do gry „Familiada” na rekolekcjach dla małżeństw.
Połącz w jedną grupę odpowiedzi znaczące to samo: synonimy, liczbę mnogą i pojedynczą, literówki,
zdrobnienia i szczegółowe przykłady tej samej kategorii (np. „ciuchy”, „ubrania”, „bluzki” → „Ubrania”).
Nie łącz odpowiedzi, które na tablicy byłyby różnymi odpowiedziami.
Każda grupa ma inną etykietę – nie twórz dwóch grup o tym samym lub bardzo podobnym znaczeniu.
Każdy ciąg z listy musi trafić do jakiejś grupy (pojedyncza odpowiedź też może być grupą).
Etykieta: po polsku, 1–3 słowa, z wielkiej litery, krótka i czytelna z daleka.
W polu members wpisz dokładnie te ciągi z pola "n", które należą do grupy. Każdy ciąg dokładnie raz.`;

function buildPrompt(question: string, uniques: UniqueAnswer[]): string {
  const list = uniques.map((u) => JSON.stringify({ n: u.normalized, przyklad: u.sampleRaw, ile: u.count })).join("\n");
  return `Pytanie: ${question}\n\nOdpowiedzi (jedna na linię):\n${list}`;
}

export class AiUnavailableError extends Error {}

/** Wywołanie Claude: propozycja grup. Wynik trzeba jeszcze zwalidować (reconcileAiGroups). */
export async function requestAiGrouping(question: string, uniques: UniqueAnswer[]): Promise<PlannedGroup[]> {
  assert(uniques.length > 0, "requestAiGrouping: nothing to group");
  const apiKey = env.anthropicKey();
  if (!apiKey) throw new AiUnavailableError("Brak klucza ANTHROPIC_API_KEY.");
  const client = new Anthropic({ apiKey, timeout: 90_000, maxRetries: 1 });
  const response = await client.messages.parse({
    model: env.anthropicModel(),
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: "low", format: zodOutputFormat(GroupingSchema) },
    messages: [{ role: "user", content: buildPrompt(question, uniques) }],
  });
  if (response.stop_reason === "refusal") throw new AiUnavailableError("Model odmówił pogrupowania odpowiedzi.");
  if (response.stop_reason === "max_tokens") throw new AiUnavailableError("Odpowiedź modelu została ucięta.");
  const parsed = response.parsed_output;
  if (!parsed) throw new AiUnavailableError("Model zwrócił nieprawidłowy JSON.");
  return parsed.groups;
}

export const OpinionSummarySchema = z.object({
  overview: z.string(),
  takeaways: z.array(z.string()),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  quotes: z.array(z.string()),
});
export type OpinionSummary = z.infer<typeof OpinionSummarySchema>;

const SUMMARY_SYSTEM = `Opracowujesz anonimowe opinie uczestników rekolekcji dla małżeństw „Jedność małżeńska a finanse”
dla prowadzących (Moniki i Dominika). Dostajesz średnie ocen (skala 1–5, NPS 1–10) i wszystkie odpowiedzi otwarte.
Pisz po polsku, rzeczowo i życzliwie, bez lukrowania – prowadzący chcą wiedzieć, co poprawić.
- overview: 3–5 zdań ogólnego obrazu, z liczbami tam, gdzie pomagają.
- takeaways: co uczestnicy przeżyli i zabierają do domu – powtarzające się motywy (przy motywie w nawiasie, ilu mniej więcej o nim pisało).
- strengths: co działało najlepiej (z ocen i z komentarzy).
- improvements: konkretne propozycje zmian w wykładach i prowadzeniu, od najczęstszych; uwzględnij też nisko ocenione pozycje.
- quotes: 3–6 najbardziej charakterystycznych cytatów dosłownie z odpowiedzi otwartych (bez zmian, bez danych osobowych).
Nie wymyślaj niczego, czego nie ma w danych. Gdy danych jest mało, powiedz to wprost.`;

/** Podsumowanie opinii przez Claude (wejście: gotowy tekst ze statystykami i odpowiedziami otwartymi). */
export async function requestOpinionSummary(input: string): Promise<OpinionSummary> {
  assert(input.trim() !== "", "requestOpinionSummary: empty input");
  const apiKey = env.anthropicKey();
  if (!apiKey) throw new AiUnavailableError("Brak klucza ANTHROPIC_API_KEY.");
  const client = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 1 });
  const response = await client.messages.parse({
    model: env.anthropicModel(),
    max_tokens: 16000,
    system: SUMMARY_SYSTEM,
    output_config: { effort: "medium", format: zodOutputFormat(OpinionSummarySchema) },
    messages: [{ role: "user", content: input }],
  });
  if (response.stop_reason === "refusal") throw new AiUnavailableError("Model odmówił podsumowania opinii.");
  if (response.stop_reason === "max_tokens") throw new AiUnavailableError("Odpowiedź modelu została ucięta.");
  const parsed = response.parsed_output;
  if (!parsed) throw new AiUnavailableError("Model zwrócił nieprawidłowy JSON.");
  return parsed;
}

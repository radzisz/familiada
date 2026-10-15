import { assert } from "./assert";

// Litery, których NFD nie rozkłada na literę + znak diakrytyczny.
const SPECIAL: Record<string, string> = { ł: "l", Ł: "l", ø: "o", đ: "d", ß: "ss" };

/** Małe litery, bez ogonków, bez interpunkcji, pojedyncze spacje. "Ubrania!" → "ubrania". */
export function normalizeAnswer(raw: string): string {
  assert(typeof raw === "string", "normalizeAnswer: raw must be a string");
  const replaced = raw.replace(/[łŁøđß]/g, (ch) => SPECIAL[ch] ?? ch);
  return replaced
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Przycina i skleja białe znaki w surowej odpowiedzi; null gdy pusta po normalizacji. */
export function cleanRawAnswer(raw: string, maxLength: number): string | null {
  assert(maxLength > 0, "cleanRawAnswer: maxLength must be positive");
  const trimmed = raw.replace(/\s+/g, " ").trim().slice(0, maxLength);
  return normalizeAnswer(trimmed) === "" ? null : trimmed;
}

/** Etykieta z surowej odpowiedzi: bez interpunkcji na brzegach, z wielkiej litery. */
export function labelFromRaw(raw: string): string {
  const core = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").trim();
  const label = core === "" ? raw.trim() : core;
  return label.charAt(0).toLocaleUpperCase("pl-PL") + label.slice(1);
}

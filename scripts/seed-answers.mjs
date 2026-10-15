// Testowe odpowiedzi do sprawdzenia systemu (grupowanie, punkty, wybór pytań, tablica).
// Wysyła ankiety przez prawdziwe /api/submit (ta sama walidacja i normalizacja co w telefonie).
// W panelu rozgrywki testowej to samo robi przycisk „Dodaj testowe ankiety”; skrypt sprawdza dodatkowo drogę HTTP.
// Użycie (id rozgrywki z adresu /admin/<id>):
//   npm run seed:answers -- --event <id>                 – 40 ankiet do http://localhost:3000
//   npm run seed:answers -- --event <id> --count 80 --url https://twoja-aplikacja.vercel.app --yes
//   npm run seed:answers -- --event <id> --clear         – usuwa tylko testowe ankiety (i puste po nich grupy)
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const POOLS = JSON.parse(readFileSync(new URL("../src/lib/data/test-answers.json", import.meta.url), "utf8"));
const MAX_COUNT = 500;
const ANSWER_RATE = 0.85;
// Testowe urządzenia mają stały prefiks UUID, więc --clear usuwa tylko je, nigdy prawdziwe ankiety.
const TEST_PREFIX = "7e570000-0000-4000-8000-";
const TEST_MIN = `${TEST_PREFIX}000000000000`;
const TEST_MAX = `${TEST_PREFIX}ffffffffffff`;

function requireEnv(...names) {
  const value = names.map((n) => process.env[n]).find((v) => v);
  if (!value) throw new Error(`Brak zmiennej środowiskowej ${names.join(" / ")} (ustaw ją w .env.local)`);
  return value;
}

function parseArgs(argv) {
  const get = (name, fallback) => {
    const i = argv.indexOf(name);
    return i === -1 ? fallback : argv[i + 1];
  };
  const count = Number(get("--count", "40"));
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) throw new Error(`--count: liczba 1–${MAX_COUNT}`);
  const url = String(get("--url", "http://localhost:3000")).replace(/\/+$/, "");
  const eventId = get("--event", "");
  if (!/^[0-9a-f-]{36}$/i.test(eventId ?? "")) throw new Error("Podaj --event <id rozgrywki> (z adresu /admin/<id>).");
  return { count, url, eventId, clear: argv.includes("--clear"), yes: argv.includes("--yes") };
}

const pick = (items) => items[Math.floor(Math.random() * items.length)];

function pickWeighted(concepts) {
  const total = concepts.reduce((sum, c) => sum + c[0], 0);
  let r = Math.random() * total;
  const hit = concepts.find((c) => (r -= c[0]) < 0) ?? concepts[concepts.length - 1];
  return pick(hit.slice(1));
}

function buildSubmission(eventId, questions, role) {
  const answers = questions
    .filter((q) => (q.audience === "all" || q.audience === role) && POOLS[q.text] && Math.random() < ANSWER_RATE)
    .map((q) => ({ questionId: q.id, text: pickWeighted(POOLS[q.text]) }));
  const deviceId = TEST_PREFIX + randomBytes(6).toString("hex");
  return { eventId, deviceId, role, answers };
}

async function postSubmission(url, body) {
  const res = await fetch(`${url}/api/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return;
  const text = await res.text();
  throw new Error(`/api/submit ${res.status}: ${text.slice(0, 200)}`);
}

async function fetchEvent(db, eventId) {
  const { data, error } = await db.from("events").select("id, name, survey_open").eq("id", eventId).maybeSingle();
  if (error) throw new Error(`Odczyt rozgrywki: ${error.message}`);
  if (!data) throw new Error(`Nie ma rozgrywki ${eventId}.`);
  return data;
}

async function fetchQuestions(db, eventId) {
  const { data, error } = await db.from("questions").select("id, audience, text, hidden").eq("event_id", eventId);
  if (error) throw new Error(`Odczyt pytań: ${error.message}`);
  return data.filter((q) => !q.hidden);
}

async function deleteTestSubmissions(db, eventId) {
  const { data, error } = await db
    .from("submissions")
    .delete()
    .eq("event_id", eventId)
    .gte("device_id", TEST_MIN)
    .lte("device_id", TEST_MAX)
    .select("id");
  if (error) throw new Error(`Usuwanie testowych ankiet: ${error.message}`);
  return data.length;
}

// PostgREST zwraca max 1000 wierszy; jedno pytanie ma ich dużo mniej, a obcięty wynik skasowałby niepuste grupy.
const MAX_ROWS = 1000;

/** Usuwa grupy pytania, w których po usunięciu testowych odpowiedzi nic nie zostało. */
async function deleteEmptyGroups(db, questionId) {
  const [groups, answers] = await Promise.all([
    db.from("answer_groups").select("id").eq("question_id", questionId).limit(MAX_ROWS),
    db.from("answers").select("group_id").eq("question_id", questionId).limit(MAX_ROWS),
  ]);
  if (groups.error || answers.error) throw new Error(`Odczyt grup: ${(groups.error ?? answers.error).message}`);
  if (answers.data.length >= MAX_ROWS) throw new Error(`Pytanie ${questionId} ma ≥${MAX_ROWS} odpowiedzi – pomijam sprzątanie grup.`);
  const used = new Set(answers.data.map((a) => a.group_id));
  const empty = groups.data.map((g) => g.id).filter((id) => !used.has(id));
  if (empty.length === 0) return 0;
  const { error } = await db.from("answer_groups").delete().in("id", empty);
  if (error) throw new Error(`Usuwanie pustych grup: ${error.message}`);
  return empty.length;
}

async function clear(db, event) {
  const removed = await deleteTestSubmissions(db, event.id);
  const questions = await fetchQuestions(db, event.id);
  const perQuestion = await Promise.all(questions.map((q) => deleteEmptyGroups(db, q.id)));
  const groups = perQuestion.reduce((sum, n) => sum + n, 0);
  console.log(`Usunięto ${removed} testowych ankiet i ${groups} pustych grup z „${event.name}”.`);
}

async function seed(db, event, { count, url }) {
  if (!event.survey_open) throw new Error("Ankieta jest zamknięta – otwórz ją w panelu rozgrywki.");
  const questions = await fetchQuestions(db, event.id);
  const missing = questions.filter((q) => !POOLS[q.text]).length;
  if (missing > 0) console.warn(`Uwaga: ${missing} pytań nie ma puli testowej w src/lib/data/test-answers.json – zostaną pominięte.`);
  for (let i = 0; i < count; i++) {
    await postSubmission(url, buildSubmission(event.id, questions, i % 2 === 0 ? "wife" : "husband"));
  }
  console.log(`Wysłano ${count} testowych ankiet do ${url} („${event.name}”). Usuniesz je: npm run seed:answers -- --event ${event.id} --clear`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(args.url);
  if (!args.clear && !local && !args.yes) throw new Error(`To nie jest adres lokalny (${args.url}). Dodaj --yes, jeśli na pewno.`);
  const db = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false } },
  );
  const event = await fetchEvent(db, args.eventId);
  await (args.clear ? clear(db, event) : seed(db, event, args));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

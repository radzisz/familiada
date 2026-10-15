// Seed: tworzy rozgrywkę z 26 domyślnymi pytaniami.
// Użycie:
//   npm run seed                              – tylko jeśli w bazie nie ma jeszcze żadnej rozgrywki
//   npm run seed -- --new "Nazwa"             – kolejna rozgrywka (poprzednie zostają w bazie)
//   npm run seed -- --new "Próba" --test      – rozgrywka testowa
// To samo (i więcej) robi formularz „Nowa rozgrywka” w /admin.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const QUESTIONS = JSON.parse(readFileSync(new URL("../src/lib/data/questions.json", import.meta.url), "utf8"));

function requireEnv(...names) {
  const value = names.map((n) => process.env[n]).find((v) => v);
  if (!value) throw new Error(`Brak zmiennej środowiskowej ${names.join(" / ")} (ustaw ją w .env.local)`);
  return value;
}

function parseArgs(argv) {
  const i = argv.indexOf("--new");
  const isTest = argv.includes("--test");
  if (i === -1) return { forceNew: false, isTest, name: "Rekolekcje dla małżeństw" };
  return { forceNew: true, isTest, name: argv[i + 1] || `Rekolekcje ${new Date().toISOString().slice(0, 10)}` };
}

async function countEvents(db) {
  const { count, error } = await db.from("events").select("id", { count: "exact", head: true });
  if (error) throw new Error(`Odczyt rozgrywek: ${error.message}`);
  return count ?? 0;
}

async function insertEventWithQuestions(db, name, isTest) {
  const { data: event, error } = await db.from("events").insert({ name, is_test: isTest }).select("id").single();
  if (error) throw new Error(`Tworzenie rozgrywki: ${error.message}`);
  const rows = QUESTIONS.map((q, i) => ({ event_id: event.id, position: i + 1, audience: q.audience, text: q.text }));
  const { error: qErr } = await db.from("questions").insert(rows);
  if (qErr) throw new Error(`Wstawianie pytań: ${qErr.message}`);
  return event.id;
}

async function main() {
  if (QUESTIONS.length !== 26) throw new Error(`Oczekiwano 26 pytań, jest ${QUESTIONS.length}`);
  const db = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false } },
  );
  const { forceNew, isTest, name } = parseArgs(process.argv.slice(2));
  const existing = await countEvents(db);
  if (existing > 0 && !forceNew) {
    console.log(`W bazie jest już ${existing} rozgrywek – nic nie zmieniam. Nową dodasz: npm run seed -- --new "Nazwa".`);
    return;
  }
  const id = await insertEventWithQuestions(db, name, isTest);
  console.log(`Utworzono rozgrywkę „${name}”${isTest ? " (testową)" : ""} z ${QUESTIONS.length} pytaniami.`);
  console.log(`Panel: /admin/${id}   Ankieta: /ankieta/${id}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

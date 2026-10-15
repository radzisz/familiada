// Seed: tworzy aktywne wydarzenie z 26 pytaniami.
// Użycie:
//   npm run seed                      – tylko jeśli nie ma aktywnego wydarzenia
//   npm run seed -- --new "Nazwa"     – nowa edycja: stare wydarzenie zostaje w bazie, ale przestaje być aktywne
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const QUESTIONS = JSON.parse(readFileSync(new URL("./questions.json", import.meta.url), "utf8"));

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Brak zmiennej środowiskowej ${name} (ustaw ją w .env.local)`);
  return value;
}

function parseArgs(argv) {
  const i = argv.indexOf("--new");
  if (i === -1) return { forceNew: false, name: "Rekolekcje dla małżeństw" };
  return { forceNew: true, name: argv[i + 1] || `Rekolekcje ${new Date().toISOString().slice(0, 10)}` };
}

async function findActiveEvent(db) {
  const { data, error } = await db.from("events").select("id, name").eq("is_active", true).maybeSingle();
  if (error) throw new Error(`Odczyt wydarzeń: ${error.message}`);
  return data;
}

async function deactivateEvent(db, id) {
  const { error } = await db.from("events").update({ is_active: false }).eq("id", id);
  if (error) throw new Error(`Dezaktywacja wydarzenia: ${error.message}`);
}

async function insertEventWithQuestions(db, name) {
  const { data: event, error } = await db.from("events").insert({ name, is_active: true }).select("id").single();
  if (error) throw new Error(`Tworzenie wydarzenia: ${error.message}`);
  const rows = QUESTIONS.map((q, i) => ({ event_id: event.id, position: i + 1, audience: q.audience, text: q.text }));
  const { error: qErr } = await db.from("questions").insert(rows);
  if (qErr) throw new Error(`Wstawianie pytań: ${qErr.message}`);
  return event.id;
}

async function main() {
  if (QUESTIONS.length !== 26) throw new Error(`Oczekiwano 26 pytań, jest ${QUESTIONS.length}`);
  const db = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  const { forceNew, name } = parseArgs(process.argv.slice(2));
  const active = await findActiveEvent(db);
  if (active && !forceNew) {
    console.log(`Aktywne wydarzenie już istnieje: „${active.name}” (${active.id}). Nic nie zmieniam.`);
    return;
  }
  if (active) await deactivateEvent(db, active.id);
  const id = await insertEventWithQuestions(db, name);
  console.log(`Utworzono wydarzenie „${name}” (${id}) z ${QUESTIONS.length} pytaniami.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

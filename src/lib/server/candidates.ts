import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCandidate } from "@/lib/autoplan";
import { boardAnswers } from "@/lib/scoring";
import type { Question } from "@/lib/types";
import { fetchAnswers, fetchGroups } from "./repo/groups";
import { fetchQuestions } from "./repo/questions";

async function fetchCandidate(db: SupabaseClient, q: Question): Promise<PlanCandidate> {
  const [answers, groups] = await Promise.all([fetchAnswers(db, q.id), fetchGroups(db, q.id)]);
  return { id: q.id, audience: q.audience, position: q.position, respondents: answers.length, board: boardAnswers(answers, groups) };
}

/** Wynik (tablica top 6) każdego widocznego pytania wydarzenia – podstawa wyboru pytań do gry. */
export async function fetchPlanCandidates(db: SupabaseClient, eventId: string): Promise<PlanCandidate[]> {
  const questions = (await fetchQuestions(db, eventId)).filter((q) => !q.hidden);
  return Promise.all(questions.map((q) => fetchCandidate(db, q)));
}

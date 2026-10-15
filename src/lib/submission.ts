import { cleanRawAnswer, normalizeAnswer } from "./normalize";
import { MAX_ANSWER_LENGTH } from "./types";

export interface SubmitAnswer {
  questionId: string;
  text: string;
}

export interface PreparedAnswer {
  question_id: string;
  raw: string;
  normalized: string;
}

/** Czyści odpowiedzi ankiety: puste odrzuca, z powtórzonego pytania bierze pierwszą, dodaje `normalized`. */
export function prepareAnswers(answers: SubmitAnswer[]): PreparedAnswer[] {
  const seen = new Set<string>();
  return answers.flatMap((a) => {
    const raw = cleanRawAnswer(a.text, MAX_ANSWER_LENGTH);
    if (raw === null || seen.has(a.questionId)) return [];
    seen.add(a.questionId);
    return [{ question_id: a.questionId, raw, normalized: normalizeAnswer(raw) }];
  });
}

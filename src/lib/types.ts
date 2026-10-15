import type { Branding } from "./branding";

export type Audience = "all" | "wife" | "husband";
export type Role = "wife" | "husband";

export const ROUND_COUNT = 5;
export const FINAL_COUNT = 5;
export const BOARD_SLOTS = 6;
export const MAX_ANSWER_LENGTH = 60;

export interface Question {
  id: string;
  position: number;
  audience: Audience;
  text: string;
  hidden: boolean;
}

/** Pytania przypisane do gry: pięć rund i pięć pytań finałowych (null = brak). */
export interface GamePlan {
  rounds: (string | null)[];
  final: (string | null)[];
}

/** Jedna pozycja na tablicy: etykieta grupy i punkty. */
export interface BoardAnswer {
  label: string;
  points: number;
}

export interface BoardQuestion {
  questionId: string;
  text: string;
  respondents: number;
  answers: BoardAnswer[];
}

export function emptyPlan(): GamePlan {
  return { rounds: Array(ROUND_COUNT).fill(null), final: Array(FINAL_COUNT).fill(null) };
}

/** Pytania gry według planu z /admin (null tam, gdzie nic nie przypisano) i oprawa rozgrywki (tytuł, organizatorzy). */
export interface Board extends Branding {
  rounds: (BoardQuestion | null)[];
  final: (BoardQuestion | null)[];
}

import type { CoOrganizer } from "@/lib/branding";
import type { BoardAnswer, GamePlan, Question } from "@/lib/types";
import type { GroupDetail } from "@/lib/detail";

export interface OverviewQuestion extends Question {
  answers: number;
  ungrouped: number;
}

export interface Overview {
  event: {
    id: string;
    name: string;
    surveyOpen: boolean;
    isTest: boolean;
    boardTitle: string;
    /** Nazwa wydarzenia; "" = nie pokazujemy. */
    eventName: string;
    coOrganizer: CoOrganizer | null;
  };
  counts: { wife: number; husband: number };
  questions: OverviewQuestion[];
  plan: GamePlan;
}

export interface DetailResponse {
  question: Question;
  respondents: number;
  ungrouped: number;
  groups: GroupDetail[];
  board: BoardAnswer[];
}

export const AUDIENCE_LABEL: Record<Question["audience"], string> = {
  all: "wszyscy",
  wife: "żony",
  husband: "mężowie",
};

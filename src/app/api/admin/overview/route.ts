import { NextResponse } from "next/server";
import { boardTitle } from "@/lib/boardTitle";
import { coOrganizerFrom } from "@/lib/branding";
import { adminRoute } from "@/lib/server/route";
import { countSubmissions } from "@/lib/server/repo/events";
import { fetchQuestions, fetchQuestionStats } from "@/lib/server/repo/questions";

export const dynamic = "force-dynamic";

/** Licznik zgłoszeń, stan ankiety, lista pytań ze statystykami i plan gry. */
export async function GET(req: Request): Promise<NextResponse> {
  return adminRoute(req, "overview", async ({ db, event }) => {
    const [counts, questions, stats] = await Promise.all([
      countSubmissions(db, event.id),
      fetchQuestions(db, event.id),
      fetchQuestionStats(db, event.id),
    ]);
    const withStats = questions.map((q) => ({ ...q, ...(stats.get(q.id) ?? { answers: 0, ungrouped: 0 }) }));
    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        surveyOpen: event.survey_open,
        isTest: event.is_test,
        boardTitle: boardTitle(event.board_title),
        eventName: event.event_name ?? "",
        coOrganizer: coOrganizerFrom(event.partner_name, event.partner_url, event.partner_logo),
      },
      counts,
      questions: withStats,
      plan: event.game_plan,
    });
  });
}

import { NextResponse } from "next/server";
import { resultsToCsv } from "@/lib/csv";
import { adminRoute } from "@/lib/server/route";
import { fetchBoardQuestion } from "@/lib/server/repo/game";
import { fetchQuestions } from "@/lib/server/repo/questions";

export const dynamic = "force-dynamic";

/** CSV z wynikami wszystkich pytań (kopia zapasowa na wieczór). */
export async function GET(): Promise<NextResponse> {
  return adminRoute("export", async ({ db, event }) => {
    const questions = await fetchQuestions(db, event.id);
    const rows = await Promise.all(questions.map((q) => fetchBoardQuestion(db, q)));
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(resultsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="familiada-wyniki-${date}.csv"`,
      },
    });
  });
}

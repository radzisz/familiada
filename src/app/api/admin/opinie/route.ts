import { NextResponse } from "next/server";
import { OPINION_QUESTIONS, type StoredAnswer } from "@/lib/opinions";
import { adminDbRoute } from "@/lib/server/route";
import { check } from "@/lib/server/db";

const csvCell = (v: string) => `"${v.replaceAll('"', '""')}"`;

/** Eksport opinii do CSV (średnik, BOM – otwiera się poprawnie w polskim Excelu). */
export async function GET(): Promise<NextResponse> {
  return adminDbRoute("admin.opinie", async (db) => {
    const { data, error } = await db.from("opinions").select("created_at, retreat, answers").order("created_at");
    check("opinions.select", error);
    const header = ["Data", "Rekolekcje", ...OPINION_QUESTIONS.map((q) => `${q.id}. ${q.text}`)];
    const lines = (data ?? []).map((r: { created_at: string; retreat: string | null; answers: StoredAnswer[] }) => [
      r.created_at, r.retreat ?? "", ...OPINION_QUESTIONS.map((q) => r.answers.find((a) => a.id === q.id)?.answer ?? ""),
    ]);
    const csv = "\uFEFF" + [header, ...lines].map((l) => l.map(csvCell).join(";")).join("\r\n");
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="opinie.csv"' },
    });
  });
}

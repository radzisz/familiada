import { NextResponse } from "next/server";
import { buildReport, retreatsOf } from "@/lib/opinionsReport";
import { renderOpinionReportPdf } from "@/lib/server/opinionsPdf";
import { fetchOpinions, loadOpinionBranding } from "@/lib/server/repo/opinions";
import { adminDbRoute } from "@/lib/server/route";

export const runtime = "nodejs";

/** Raport z opinii jako plik PDF do pobrania (`?r=` rekolekcje, `?otwarte=1` z odpowiedziami otwartymi). */
export async function GET(req: Request): Promise<NextResponse> {
  return adminDbRoute("admin.opinie.raport", async (db) => {
    const params = new URL(req.url).searchParams;
    const all = await fetchOpinions(db);
    const requested = params.get("r");
    const retreat = requested && retreatsOf(all).includes(requested) ? requested : null;
    const rows = retreat === null ? all : all.filter((r) => r.retreat === retreat);
    const branding = await loadOpinionBranding(db);
    const retreatLabel = retreat ?? (retreatsOf(rows).length === 1 ? retreatsOf(rows)[0] : null);
    const date = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
    const pdf = await renderOpinionReportPdf(db, {
      report: buildReport(rows),
      branding,
      subtitle: [branding.eventName, retreatLabel, `stan na ${date}`].filter(Boolean).join(" · "),
      withOpen: params.get("otwarte") === "1",
    });
    const slug = (retreatLabel ?? "wszystkie").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L")
      .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="raport-opinie-${slug || "wszystkie"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  });
}

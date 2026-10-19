import { PinForm } from "@/components/PinForm";
import { NpsChart, ScaleLegend, ScaleRow } from "@/components/opinions/OpinionCharts";
import { PrintButton } from "@/components/opinions/PrintButton";
import { OPINION_SURVEY } from "@/lib/opinions";
import { buildReport, formatAvg, retreatsOf } from "@/lib/opinionsReport";
import { isAdmin } from "@/lib/server/auth";
import { serviceClient } from "@/lib/server/db";
import { fetchOpinions, loadOpinionBranding } from "@/lib/server/repo/opinions";
import "@/components/opinions/report.css";
import "./raport.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Raport – opinie o rekolekcjach" };

/**
 * Raport graficzny dla organizatorów: liczby, oceny w sekcjach, NPS; odpowiedzi otwarte tylko po `?otwarte=1`.
 * Wysyła się go jako PDF (drukowanie → Zapisz jako PDF).
 */
export default async function OpinionReportPage({ searchParams }: { searchParams: Promise<{ r?: string; otwarte?: string }> }) {
  if (!(await isAdmin())) return <PinForm title="Raport – opinie o rekolekcjach" />;
  const params = await searchParams;
  const db = serviceClient();
  const all = await fetchOpinions(db);
  const retreat = params.r && retreatsOf(all).includes(params.r) ? params.r : null;
  const rows = retreat === null ? all : all.filter((r) => r.retreat === retreat);
  const withOpen = params.otwarte === "1";
  const report = buildReport(rows);
  const branding = await loadOpinionBranding(db);
  const retreatLabel = retreat ?? (retreatsOf(rows).length === 1 ? retreatsOf(rows)[0] : null);
  const toggleHref = `/admin/opinie/raport?${new URLSearchParams({ ...(retreat ? { r: retreat } : {}), ...(withOpen ? {} : { otwarte: "1" }) })}`;
  const nps = report.nps;
  const sectionsWithScales = report.sections.filter((s) => s.scales.length > 0);

  return (
    <main className="rp">
      <div className="rp-tools">
        <a href={`/admin/opinie?widok=podsumowanie${retreat ? `&r=${encodeURIComponent(retreat)}` : ""}`}>← Opinie</a>
        <a href={toggleHref}>{withOpen ? "Bez odpowiedzi otwartych" : "Dołącz odpowiedzi otwarte"}</a>
        <PrintButton />
      </div>
      <article className="rp-page">
        <header className="rp-head">
          <div>
            <p className="rp-kicker">Raport z ankiety uczestników</p>
            <h1>{OPINION_SURVEY.title}</h1>
            <p className="rp-sub">
              {[branding.eventName, retreatLabel].filter(Boolean).join(" · ")}
              {" · "}stan na {new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="rp-logos">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo z /api/logo (data URL w cache), bez optymalizacji */}
            {branding.partners.map((p) => <img key={p.name} src={p.src} alt={p.name} className={p.fill ? "fill" : undefined} />)}
          </div>
        </header>

        {report.responses === 0 ? <p>Brak opinii.</p> : (
          <>
            <section className="rp-kpis">
              <Kpi value={String(report.responses)} label="wypełnionych ankiet" />
              <Kpi value={formatAvg(report.overallAvg)} unit="/ 5" label="średnia wszystkich ocen" />
              {nps && <Kpi value={nps.score === null ? "–" : `${nps.score > 0 ? "+" : ""}${nps.score}`} label="NPS (skłonność do polecenia)" />}
              {nps && nps.total > 0 && <Kpi value={`${Math.round((nps.promoters / nps.total) * 100)}%`} label="na pewno poleci (9–10)" />}
            </section>

            <section className="rp-block">
              <h2>Oceny w obszarach</h2>
              <div className="rp-areas">
                {sectionsWithScales.map((s) => (
                  <div key={s.title} className="rp-area">
                    <span>{s.title}</span>
                    <div className="rp-area-bar" role="img" aria-label={`${s.title}: ${formatAvg(s.avg)} na 5`}>
                      <i style={{ width: `${((s.avg ?? 0) / 5) * 100}%` }} />
                    </div>
                    <b>{formatAvg(s.avg)}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="rp-block">
              <div className="rp-block-head">
                <h2>Szczegóły ocen</h2>
                <ScaleLegend />
              </div>
              {sectionsWithScales.map((s) => (
                <div key={s.title} className="rp-section">
                  <h3>{s.title}</h3>
                  {s.scales.map((q) => <ScaleRow key={q.question.id} stats={q} />)}
                </div>
              ))}
            </section>

            {nps && nps.total > 0 && (
              <section className="rp-block">
                <h2>{nps.question.text}</h2>
                <p className="rp-note">
                  NPS = % polecających (9–10) − % krytyków (1–6); zakres od −100 do +100. Średnia ocena: {formatAvg(nps.avg)} / 10.
                </p>
                <NpsChart nps={nps} />
              </section>
            )}

            {withOpen && report.sections.flatMap((s) => s.texts).map((t) => (
              <section key={t.question.id} className="rp-block rp-open">
                <h2>{t.question.text} <small>({t.answers.length})</small></h2>
                {t.answers.map((a, i) => <blockquote key={i}>{a}</blockquote>)}
              </section>
            ))}
          </>
        )}
        <footer className="rp-foot">Ankieta anonimowa · {branding.partners.map((p) => p.name).join(" · ")}</footer>
      </article>
    </main>
  );
}

function Kpi({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="rp-kpi">
      <b>{value}{unit && <small> {unit}</small>}</b>
      <span>{label}</span>
    </div>
  );
}

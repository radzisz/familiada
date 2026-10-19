import { PinForm } from "@/components/PinForm";
import { NpsChart, ScaleLegend, ScaleRow } from "@/components/opinions/OpinionCharts";
import { OpinionAiSummary } from "@/components/opinions/OpinionAiSummary";
import { npsScore, OPINION_QUESTIONS, OPINION_SURVEY, type OpinionQuestion } from "@/lib/opinions";
import { buildReport, formatAvg, retreatsOf, type OpinionReport, type OpinionRow, type ScaleStats } from "@/lib/opinionsReport";
import { isAdmin } from "@/lib/server/auth";
import { serviceClient } from "@/lib/server/db";
import { fetchContacts, fetchOpinions } from "@/lib/server/repo/opinions";
import "@/components/admin/admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opinie o rekolekcjach" };

const VIEWS = [
  { key: "odpowiedzi", label: "Odpowiedzi" },
  { key: "podsumowanie", label: "Podsumowanie" },
  { key: "tabela", label: "Tabela" },
  { key: "kontakty", label: "Kontakty" },
] as const;
type View = (typeof VIEWS)[number]["key"];

interface Params { widok?: string; r?: string }

/** Opinie o rekolekcjach: przeglądanie ankiet, podsumowanie z pytaniami otwartymi, tabela, kontakty; raport osobno. */
export default async function OpinionsAdminPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!(await isAdmin())) return <PinForm title="Opinie o rekolekcjach" />;
  const params = await searchParams;
  const view: View = VIEWS.find((v) => v.key === params.widok)?.key ?? "odpowiedzi";
  const db = serviceClient();
  const all = await fetchOpinions(db);
  const retreats = retreatsOf(all);
  const retreat = params.r && retreats.includes(params.r) ? params.r : null;
  const rows = retreat === null ? all : all.filter((r) => r.retreat === retreat);
  const href = (p: Params) => {
    const q = new URLSearchParams();
    const w = p.widok ?? view;
    if (w !== "odpowiedzi") q.set("widok", w);
    const r = "r" in p ? p.r : retreat;
    if (r) q.set("r", r);
    const s = q.toString();
    return s ? `/admin/opinie?${s}` : "/admin/opinie";
  };
  const reportHref = `/admin/opinie/raport${retreat ? `?r=${encodeURIComponent(retreat)}` : ""}`;

  return (
    <main className="ad">
      <div className="ad-head">
        <h1>Opinie o rekolekcjach <small>({rows.length})</small></h1>
        <div className="ad-nav">
          <a href={reportHref}>Raport dla organizatorów</a>
          <a href="/api/admin/opinie" download>Pobierz CSV</a>
          <a href="/opinie">Formularz</a>
        </div>
      </div>
      <nav className="ad-nav" aria-label="Widok">
        {VIEWS.map((v) => (
          <a key={v.key} href={href({ widok: v.key })} aria-current={v.key === view ? "page" : undefined}
            style={v.key === view ? { background: "var(--ad-green)", color: "#fff", borderColor: "var(--ad-green)" } : undefined}>
            {v.label}
          </a>
        ))}
      </nav>
      {retreats.length > 1 && view !== "kontakty" && (
        <p className="ad-row" style={{ margin: 0 }}>
          Rekolekcje:{" "}
          {[{ label: "wszystkie", r: undefined }, ...retreats.map((r) => ({ label: r, r }))].map((o) => (
            <a key={o.label} href={href({ r: o.r })} style={{ fontWeight: (o.r ?? null) === retreat ? 700 : 400 }}>{o.label}</a>
          ))}
        </p>
      )}
      {rows.length === 0 && view !== "kontakty" ? <p className="ad-empty">Brak opinii.</p> : (
        <>
          {view === "odpowiedzi" && <Responses rows={rows} />}
          {view === "podsumowanie" && <Summary report={buildReport(rows)} retreat={retreat} />}
          {view === "tabela" && <Table rows={rows} />}
        </>
      )}
      {view === "kontakty" && <Contacts />}
    </main>
  );
}

/** Każda ankieta osobno, od najnowszej, pogrupowana w sekcje jak w formularzu. */
function Responses({ rows }: { rows: OpinionRow[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 860 }}>
      {rows.map((r, i) => (
        <article key={r.id} className="ad-panel" id={`ankieta-${rows.length - i}`}>
          <h3>
            Ankieta nr {rows.length - i}{" "}
            <small>{new Date(r.created_at).toLocaleString("pl-PL")}{r.retreat ? ` · ${r.retreat}` : ""}</small>
          </h3>
          {OPINION_SURVEY.sections.map((s) => {
            const answered = s.questions.flatMap((q) => {
              const a = r.answers.find((x) => x.id === q.id)?.answer;
              return a === undefined ? [] : [{ q, a }];
            });
            if (answered.length === 0) return null;
            return (
              <section key={s.title} style={{ marginTop: 8 }}>
                <div className="ad-muted" style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.title}</div>
                {answered.map(({ q, a }) => q.type === "text" ? (
                  <div key={q.id} style={{ margin: "6px 0" }}>
                    <div className="ad-muted" style={{ fontSize: 14 }}>{q.text}</div>
                    <blockquote style={quote}>{a}</blockquote>
                  </div>
                ) : (
                  <div key={q.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0", borderBottom: "1px solid #eef3f1" }}>
                    <span>{q.text}</span>
                    <b style={{ color: scoreColor(q, Number(a)), whiteSpace: "nowrap" }}>{a} / {q.type === "nps" ? 10 : 5}</b>
                  </div>
                ))}
              </section>
            );
          })}
          {!r.answers.some((a) => TEXT_IDS.has(a.id)) && <p className="ad-muted" style={{ fontSize: 14, marginTop: 6 }}>Bez odpowiedzi otwartych.</p>}
        </article>
      ))}
    </div>
  );
}

const TEXT_IDS = new Set(OPINION_QUESTIONS.filter((q) => q.type === "text").map((q) => q.id));

function scoreColor(q: OpinionQuestion, v: number): string {
  const low = q.type === "nps" ? v <= 6 : v <= 2;
  const high = q.type === "nps" ? v >= 9 : v >= 4;
  return low ? "#b3261e" : high ? "#1F4A42" : "#5a6b66";
}

/** Podsumowanie dla prowadzących: liczby, mocne i słabe punkty, AI i wszystkie odpowiedzi otwarte. */
function Summary({ report, retreat }: { report: OpinionReport; retreat: string | null }) {
  const scales = report.sections.flatMap((s) => s.scales).filter((s) => s.avg !== null);
  const sorted = [...scales].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const top = sorted.slice(0, 3);
  const bottom = sorted.slice(-3).reverse();
  const lowVotes = scales.filter((s) => lowCount(s) > 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 960 }}>
      <section className="ad-panel">
        <h2>W skrócie</h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          <li><b>{report.responses}</b> ankiet, średnia wszystkich ocen <b>{formatAvg(report.overallAvg)}</b> / 5</li>
          {report.nps && <li>NPS <b>{report.nps.score ?? "–"}</b> ({report.nps.promoters} polecających, {report.nps.passives} neutralnych, {report.nps.detractors} krytyków)</li>}
          {report.sections.filter((s) => s.avg !== null).map((s) => <li key={s.title}>{s.title}: <b>{formatAvg(s.avg)}</b></li>)}
        </ul>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 12 }}>
          <RankList title="Najwyżej ocenione" items={top} />
          <RankList title="Najniżej ocenione" items={bottom} />
        </div>
        {lowVotes.length > 0 && (
          <p className="ad-muted" style={{ marginTop: 10, fontSize: 14 }}>
            Oceny 1–2 pojawiły się przy: {lowVotes.map((s) => `${s.question.text} (${lowCount(s)})`).join(", ")}.
          </p>
        )}
      </section>
      <OpinionAiSummary retreat={retreat} />
      {report.sections.flatMap((s) => s.texts).map((t) => (
        <section key={t.question.id} className="ad-panel">
          <h2>{t.question.text} <small>({t.answers.length})</small></h2>
          {t.answers.length === 0 ? <p className="ad-muted">Brak odpowiedzi.</p> : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {t.answers.map((a, i) => <li key={i}><blockquote style={quote}>{a}</blockquote></li>)}
            </ul>
          )}
        </section>
      ))}
      <section className="ad-panel">
        <h2>Oceny</h2>
        <ScaleLegend />
        {report.sections.filter((s) => s.scales.length > 0).map((s) => (
          <div key={s.title} style={{ marginTop: 12 }}>
            <h3>{s.title} <small>średnia {formatAvg(s.avg)}</small></h3>
            {s.scales.map((q) => <ScaleRow key={q.question.id} stats={q} />)}
          </div>
        ))}
        {report.nps && (
          <div style={{ marginTop: 12 }}>
            <h3>{report.nps.question.text} <small>NPS {report.nps.score ?? "–"}</small></h3>
            <NpsChart nps={report.nps} />
          </div>
        )}
      </section>
    </div>
  );
}

const lowCount = (s: ScaleStats) => (s.counts[0] ?? 0) + (s.counts[1] ?? 0);

function RankList({ title, items }: { title: string; items: ScaleStats[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        {items.map((s) => <li key={s.question.id}>{s.question.text} – <b>{formatAvg(s.avg)}</b></li>)}
      </ol>
    </div>
  );
}

/** Wszystkie ankiety w jednej tabeli (jak CSV), ze średnimi. */
function Table({ rows }: { rows: OpinionRow[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 14, background: "#fff" }}>
        <thead>
          <tr>
            <th style={cell}>Data</th>
            <th style={cell}>Rekolekcje</th>
            {OPINION_QUESTIONS.map((q) => <th key={q.id} style={cell}>{q.id}. {q.text}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr style={{ fontWeight: 700 }}>
            <td style={cell} colSpan={2}>Średnia</td>
            {OPINION_QUESTIONS.map((q) => <td key={q.id} style={cell}>{average(rows, q)}</td>)}
          </tr>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={cell}>{new Date(r.created_at).toLocaleString("pl-PL")}</td>
              <td style={cell}>{r.retreat ?? ""}</td>
              {OPINION_QUESTIONS.map((q) => (
                <td key={q.id} style={cell}>{r.answers.find((a) => a.id === q.id)?.answer ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function Contacts() {
  const contacts = await fetchContacts(serviceClient());
  return (
    <section>
      <h2>Kontakty <small>({contacts.length}) – zapisane osobno, bez powiązania z odpowiedziami</small></h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 14, background: "#fff" }}>
          <thead>
            <tr>{["Data", "Rekolekcje", "Imię i nazwisko", "E-mail"].map((h) => <th key={h} style={cell}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td style={cell}>{new Date(c.created_at).toLocaleString("pl-PL")}</td>
                <td style={cell}>{c.retreat ?? ""}</td>
                <td style={cell}>{c.name ?? ""}</td>
                <td style={cell}><a href={`mailto:${c.email}`}>{c.email}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Średnia ocen z liczbą odpowiedzi, np. „4,3 (12)”; przy NPS dodatkowo wynik NPS. */
function average(rows: OpinionRow[], q: OpinionQuestion): string {
  if (q.type === "text") return "";
  const values = rows.flatMap((r) => r.answers.filter((a) => a.id === q.id).map((a) => Number(a.answer)));
  if (values.length === 0) return "–";
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const text = `${avg.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} (${values.length})`;
  return q.type === "nps" ? `NPS ${npsScore(values)} · śr. ${text}` : text;
}

const cell: React.CSSProperties = { border: "1px solid #cfdcd7", padding: "6px 8px", verticalAlign: "top", textAlign: "left", whiteSpace: "pre-wrap", minWidth: 120 };
const quote: React.CSSProperties = { margin: "4px 0 0", padding: "8px 12px", borderLeft: "3px solid var(--ad-gold)", background: "#fffaf0", borderRadius: "0 8px 8px 0", whiteSpace: "pre-wrap" };

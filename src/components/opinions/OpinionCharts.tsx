import { formatAvg, type NpsStats, type ScaleStats } from "@/lib/opinionsReport";
import "./report.css";

const pct = (n: number, total: number) => (total === 0 ? 0 : (n / total) * 100);
const share = (n: number, total: number) => `${Math.round(pct(n, total))}%`;

/** Legenda skali 1–5 (kolory jak w paskach rozkładu). */
export function ScaleLegend() {
  return (
    <div className="or-legend" aria-hidden>
      {["1 zdecydowanie nie", "2", "3", "4", "5 zdecydowanie tak"].map((label, i) => (
        <span key={label}><i className={`or-s${i + 1}`} />{label}</span>
      ))}
    </div>
  );
}

/** Wiersz pytania: treść, pasek rozkładu ocen 1–5 (100%) i średnia. */
export function ScaleRow({ stats }: { stats: ScaleStats }) {
  const { counts, total } = stats;
  const label = counts.map((c, i) => `${i + 1}: ${c}`).join(", ");
  return (
    <div className="or-row">
      <div className="or-row-text">{stats.question.text}</div>
      <div className="or-bar" role="img" aria-label={`Rozkład ocen – ${label}`}>
        {counts.map((c, i) => c > 0 && (
          <span key={i} className={`or-s${i + 1}`} style={{ width: `${pct(c, total)}%` }}
            title={`ocena ${i + 1}: ${c} (${share(c, total)})`}>
            {pct(c, total) >= 12 ? share(c, total) : ""}
          </span>
        ))}
      </div>
      <div className="or-row-avg"><b>{formatAvg(stats.avg)}</b><small> / 5 · {total}</small></div>
    </div>
  );
}

/** NPS: wynik, podział na krytyków / neutralnych / polecających i rozkład ocen 1–10. */
export function NpsChart({ nps }: { nps: NpsStats }) {
  const groups = [
    { key: "det", label: "krytycy (1–6)", n: nps.detractors },
    { key: "pas", label: "neutralni (7–8)", n: nps.passives },
    { key: "pro", label: "polecający (9–10)", n: nps.promoters },
  ];
  const max = Math.max(1, ...nps.counts);
  return (
    <div className="or-nps">
      <div className="or-bar or-bar-nps" role="img" aria-label={groups.map((g) => `${g.label}: ${g.n}`).join(", ")}>
        {groups.map((g) => g.n > 0 && (
          <span key={g.key} className={`or-${g.key}`} style={{ width: `${pct(g.n, nps.total)}%` }} title={`${g.label}: ${g.n}`}>
            {pct(g.n, nps.total) >= 12 ? share(g.n, nps.total) : ""}
          </span>
        ))}
      </div>
      <div className="or-legend">
        {groups.map((g) => <span key={g.key}><i className={`or-${g.key}`} />{g.label}: <b>{g.n}</b> ({share(g.n, nps.total)})</span>)}
      </div>
      <div className="or-cols" role="img" aria-label={`Rozkład ocen 1–10: ${nps.counts.join(", ")}`}>
        {nps.counts.map((c, i) => (
          <div key={i} className="or-col" title={`${i + 1}: ${c}`}>
            <div className="or-col-plot">
              <span className={i >= 8 ? "or-pro" : i >= 6 ? "or-pas" : "or-det"} style={{ height: `${(c / max) * 100}%` }}>
                {c > 0 && <small>{c}</small>}
              </span>
            </div>
            <em>{i + 1}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

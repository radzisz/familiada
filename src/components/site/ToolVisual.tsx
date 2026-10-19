import type { ToolSlug } from "@/lib/site";

/** Podgląd narzędzia narysowany w CSS – bez zrzutów ekranu, które trzeba by aktualizować. */
export function ToolVisual({ slug, compact = false }: { slug: ToolSlug; compact?: boolean }) {
  const cls = `st-visual st-visual-${slug}${compact ? " compact" : ""}`;
  if (slug === "familiada") return <BoardVisual className={cls} />;
  if (slug === "ankiety") return <SurveyVisual className={cls} />;
  return <SongVisual className={cls} />;
}

const BOARD_ROWS: [string, number | null][] = [
  ["PIENIĄDZE", 32], ["CZAS", 21], ["DZIECI", 14], ["TEŚCIOWA", null], ["PILOT OD TV", null],
];

function BoardVisual({ className }: { className: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="bv-board">
        <p className="bv-q">O co małżonkowie kłócą się najczęściej?</p>
        <ol className="bv-rows">
          {BOARD_ROWS.map(([text, pts], i) => (
            <li key={text} className={pts === null ? "hidden" : undefined}>
              <span>{i + 1}</span>
              <span className="bv-text">{pts === null ? "··················" : text}</span>
              <span>{pts ?? "--"}</span>
            </li>
          ))}
        </ol>
        <div className="bv-foot"><span className="bv-x">✕</span><span>SUMA 67</span></div>
      </div>
    </div>
  );
}

const SURVEY_BARS = [4, 9, 22, 41, 24];

function SurveyVisual({ className }: { className: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="svv-phone">
        <div className="svv-progress"><span style={{ width: "60%" }} /></div>
        <p className="svv-step">Pytanie 6 z 10</p>
        <p className="svv-q">Jak oceniasz wieczorne spotkania w grupach?</p>
        <div className="svv-scale">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={n === 4 ? "on" : undefined}>{n}</span>)}</div>
      </div>
      <div className="svv-report">
        <p>Wieczory w grupach <b>4,3</b></p>
        <div className="svv-bars">{SURVEY_BARS.map((v, i) => <span key={i} style={{ height: `${v * 2}%` }} />)}</div>
        <p className="svv-nps">NPS <b>+62</b></p>
      </div>
    </div>
  );
}

const SONG: [string, string][] = [
  ["G          D", "Idziemy razem drogą"],
  ["e          C", "przez góry i doliny,"],
  ["G          D", "a światło nas prowadzi"],
  ["C          G", "do domu, do rodziny."],
];

function SongVisual({ className }: { className: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="sg-screen">
        <p className="sg-title">Idziemy razem <small>zwrotka 1/3</small></p>
        <p className="sg-big">Idziemy razem drogą<br />przez góry i doliny…</p>
      </div>
      <div className="sg-phone">
        {SONG.map(([chords, line]) => (
          <p key={line}><span className="sg-ch">{chords}</span>{line}</p>
        ))}
      </div>
    </div>
  );
}

import { npsScore, OPINION_SURVEY, scaleOf, type OpinionQuestion, type StoredAnswer } from "./opinions";

/** Opracowanie opinii: statystyki do raportu dla organizatorów i podsumowania dla prowadzących. */

export interface OpinionRow {
  id: string;
  created_at: string;
  retreat: string | null;
  answers: StoredAnswer[];
}

export interface ScaleStats {
  question: OpinionQuestion;
  /** Liczba odpowiedzi na każdą ocenę, od najniższej (indeks 0 = ocena 1). */
  counts: number[];
  total: number;
  /** Średnia; null bez odpowiedzi. */
  avg: number | null;
}

export interface SectionStats {
  title: string;
  /** Średnia ze wszystkich ocen 1–5 sekcji; null, gdy sekcja nie ma ocen. */
  avg: number | null;
  scales: ScaleStats[];
  texts: { question: OpinionQuestion; answers: string[] }[];
}

export interface NpsStats {
  question: OpinionQuestion;
  score: number | null;
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  counts: number[];
  avg: number | null;
}

export interface OpinionReport {
  responses: number;
  /** Średnia wszystkich ocen 1–5. */
  overallAvg: number | null;
  sections: SectionStats[];
  nps: NpsStats | null;
}

const answerOf = (row: OpinionRow, id: string) => row.answers.find((a) => a.id === id)?.answer;

const mean = (values: number[]) => (values.length === 0 ? null : values.reduce((s, v) => s + v, 0) / values.length);

function scaleStats(rows: OpinionRow[], q: OpinionQuestion): ScaleStats {
  const steps = scaleOf(q);
  const values = rows.flatMap((r) => {
    const a = answerOf(r, q.id);
    return a !== undefined && steps.includes(a) ? [Number(a)] : [];
  });
  return { question: q, counts: steps.map((s) => values.filter((v) => v === Number(s)).length), total: values.length, avg: mean(values) };
}

/** Wszystkie statystyki z listy opinii (w kolejności pytań z ankiety). */
export function buildReport(rows: OpinionRow[]): OpinionReport {
  let nps: NpsStats | null = null;
  const allScale: number[] = [];
  const sections = OPINION_SURVEY.sections.flatMap((section): SectionStats[] => {
    const scales: ScaleStats[] = [];
    const texts: SectionStats["texts"] = [];
    for (const q of section.questions) {
      if (q.type === "text") {
        texts.push({ question: q, answers: rows.flatMap((r) => answerOf(r, q.id) ?? []) });
      } else if (q.type === "nps") {
        const s = scaleStats(rows, q);
        const values = s.counts.flatMap((c, i) => Array<number>(c).fill(i + 1));
        nps = {
          question: q, score: npsScore(values), total: s.total, counts: s.counts, avg: s.avg,
          promoters: values.filter((v) => v >= 9).length,
          passives: values.filter((v) => v === 7 || v === 8).length,
          detractors: values.filter((v) => v <= 6).length,
        };
      } else {
        const s = scaleStats(rows, q);
        scales.push(s);
        s.counts.forEach((c, i) => allScale.push(...Array<number>(c).fill(i + 1)));
      }
    }
    if (scales.length === 0 && texts.length === 0) return [];
    const sectionValues = scales.flatMap((s) => s.counts.flatMap((c, i) => Array<number>(c).fill(i + 1)));
    return [{ title: section.title, avg: mean(sectionValues), scales, texts }];
  });
  return { responses: rows.length, overallAvg: mean(allScale), sections, nps };
}

/** Średnia po polsku z jednym miejscem po przecinku, np. „4,3”; „–” bez danych. */
export const formatAvg = (v: number | null) =>
  v === null ? "–" : v.toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Rekolekcje występujące w opiniach (bez pustych), alfabetycznie. */
export function retreatsOf(rows: OpinionRow[]): string[] {
  return [...new Set(rows.flatMap((r) => r.retreat ?? []))].sort((a, b) => a.localeCompare(b, "pl"));
}

/** Dane dla modelu: oceny pytań i wszystkie odpowiedzi otwarte, jako zwykły tekst. */
export function summaryInput(report: OpinionReport): string {
  const lines = [`Liczba ankiet: ${report.responses}`, `Średnia wszystkich ocen 1–5: ${formatAvg(report.overallAvg)}`];
  if (report.nps) {
    const n = report.nps;
    lines.push(`NPS: ${n.score ?? "–"} (polecający ${n.promoters}, neutralni ${n.passives}, krytycy ${n.detractors}, średnia ${formatAvg(n.avg)}/10)`);
  }
  for (const s of report.sections) {
    lines.push("", `## ${s.title}${s.avg === null ? "" : ` (średnia ${formatAvg(s.avg)})`}`);
    for (const q of s.scales) lines.push(`- ${q.question.text}: ${formatAvg(q.avg)} (${q.total} odp., rozkład 1–5: ${q.counts.join("/")})`);
    for (const t of s.texts) {
      lines.push(`### ${t.question.text} (${t.answers.length} odp.)`);
      for (const a of t.answers) lines.push(`- ${a.replaceAll(/\s+/g, " ")}`);
    }
  }
  return lines.join("\n");
}

import { describe, expect, it } from "vitest";
import { prepareOpinion } from "@/lib/opinions";
import { buildReport, summaryInput, type OpinionRow } from "@/lib/opinionsReport";

const row = (answers: Record<string, string>, retreat: string | null = null): OpinionRow =>
  ({ id: crypto.randomUUID(), created_at: "2026-10-18T12:00:00Z", retreat, answers: prepareOpinion(answers) });

describe("opinionsReport", () => {
  const rows = [
    row({ w1: "5", w2: "3", nps: "10", o1: "Rozmowa o budżecie" }),
    row({ w1: "4", nps: "6", o2: "Krótsze wykłady" }),
    row({ w1: "5", nps: "9" }),
  ];
  const report = buildReport(rows);

  it("rozkład i średnia pytania", () => {
    const w1 = report.sections[0]?.scales.find((s) => s.question.id === "w1");
    expect(w1?.counts).toEqual([0, 0, 0, 1, 2]);
    expect(w1?.total).toBe(3);
    expect(w1?.avg).toBeCloseTo(14 / 3);
  });

  it("średnia sekcji i ogólna liczą tylko oceny 1–5", () => {
    expect(report.sections[0]?.avg).toBeCloseTo(17 / 4);
    expect(report.overallAvg).toBeCloseTo(17 / 4);
  });

  it("NPS z podziałem na grupy", () => {
    expect(report.nps).toMatchObject({ score: 33, total: 3, promoters: 2, passives: 0, detractors: 1 });
  });

  it("odpowiedzi otwarte trafiają do podsumowania", () => {
    const texts = report.sections.flatMap((s) => s.texts);
    expect(texts.map((t) => t.answers)).toEqual([["Rozmowa o budżecie"], ["Krótsze wykłady"]]);
    expect(summaryInput(report)).toContain("- Krótsze wykłady");
  });

  it("bez opinii – puste statystyki", () => {
    const empty = buildReport([]);
    expect(empty.overallAvg).toBeNull();
    expect(empty.nps?.score).toBeNull();
  });
});

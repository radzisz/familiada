import type { BoardQuestion } from "./types";

function cell(value: string | number): string {
  const s = String(value);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV (średnik – Excel w polskiej wersji) z wynikami: pytanie, odpowiadających, potem pary odpowiedź;punkty. */
export function resultsToCsv(rows: BoardQuestion[]): string {
  const header = ["Pytanie", "Odpowiedzi", ...[1, 2, 3, 4, 5, 6].flatMap((i) => [`Odp. ${i}`, `Pkt ${i}`])];
  const lines = rows.map((r) => [r.text, r.respondents, ...r.answers.flatMap((a) => [a.label, a.points])]);
  const body = [header, ...lines].map((line) => line.map(cell).join(";")).join("\r\n");
  return `﻿${body}\r\n`;
}

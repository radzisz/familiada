import { describe, expect, it } from "vitest";
import { resultsToCsv } from "@/lib/csv";

describe("resultsToCsv", () => {
  it("writes header and quoted rows", () => {
    const csv = resultsToCsv([
      { questionId: "q", text: 'Co "lubisz"; czemu?', respondents: 4, answers: [{ label: "Kawa", points: 75 }] },
    ]);
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    expect(lines[0]).toMatch(/^Pytanie;Odpowiedzi;Odp\. 1;Pkt 1/);
    expect(lines[1]).toBe('"Co ""lubisz""; czemu?";4;Kawa;75');
  });
});

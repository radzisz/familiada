"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";

interface Summary {
  overview: string;
  takeaways: string[];
  strengths: string[];
  improvements: string[];
  quotes: string[];
}

const PARTS: { key: Exclude<keyof Summary, "overview" | "quotes">; title: string }[] = [
  { key: "takeaways", title: "Co uczestnicy zabierają do domu" },
  { key: "strengths", title: "Co działało" },
  { key: "improvements", title: "Co poprawić" },
];

/** Podsumowanie opinii przez AI na żądanie (z ocen i wszystkich odpowiedzi otwartych). */
export function OpinionAiSummary({ retreat }: { retreat: string | null }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    const res = await postJson<Summary>("/api/admin/opinie/podsumowanie", { retreat });
    setBusy(false);
    if (res.ok) setSummary(res.data);
    else setError(res.error);
  }

  return (
    <section className="ad-panel">
      <div className="ad-toolbar">
        <h2>Podsumowanie AI <small>z ocen i odpowiedzi otwartych</small></h2>
        <button className="primary" onClick={generate} disabled={busy}>
          {busy ? "Opracowuję… (do minuty)" : summary ? "Wygeneruj ponownie" : "Wygeneruj podsumowanie"}
        </button>
      </div>
      {error && <p className="ad-error">{error}</p>}
      {summary && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{summary.overview}</p>
          {PARTS.map((p) => summary[p.key].length > 0 && (
            <div key={p.key}>
              <h3>{p.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.5 }}>
                {summary[p.key].map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
          {summary.quotes.length > 0 && (
            <div>
              <h3>Głosy uczestników</h3>
              {summary.quotes.map((q, i) => <p key={i} style={{ margin: "4px 0", fontStyle: "italic" }}>„{q}”</p>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

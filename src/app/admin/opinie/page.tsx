import { PinForm } from "@/components/PinForm";
import { OPINION_QUESTIONS, type StoredAnswer } from "@/lib/opinions";
import { isAdmin } from "@/lib/server/auth";
import { check, serviceClient } from "@/lib/server/db";
import "@/components/admin/admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opinie o rekolekcjach" };

interface OpinionRow {
  id: string;
  created_at: string;
  retreat: string | null;
  answers: StoredAnswer[];
}

/** Surowy podgląd zebranych opinii – opracowanie później (CSV pod `/api/admin/opinie`). */
export default async function OpinionsAdminPage() {
  if (!(await isAdmin())) return <PinForm title="Opinie o rekolekcjach" />;
  const { data, error } = await serviceClient()
    .from("opinions").select("id, created_at, retreat, answers").order("created_at", { ascending: false });
  check("opinions.select", error);
  const rows = (data ?? []) as OpinionRow[];
  return (
    <main className="ad">
      <h1>Opinie o rekolekcjach <small>({rows.length})</small></h1>
      <p><a href="/api/admin/opinie" download>Pobierz CSV</a> · formularz: <a href="/opinie">/opinie</a></p>
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
              {OPINION_QUESTIONS.map((q) => <td key={q.id} style={cell}>{q.type === "scale" ? average(rows, q.id) : ""}</td>)}
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
    </main>
  );
}

/** Średnia ocen 1–5 z liczbą odpowiedzi, np. „4,3 (12)”. */
function average(rows: OpinionRow[], id: string): string {
  const values = rows.flatMap((r) => r.answers.filter((a) => a.id === id).map((a) => Number(a.answer)));
  if (values.length === 0) return "–";
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return `${avg.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} (${values.length})`;
}

const cell: React.CSSProperties = { border: "1px solid #cfdcd7", padding: "6px 8px", verticalAlign: "top", textAlign: "left", whiteSpace: "pre-wrap", minWidth: 120 };

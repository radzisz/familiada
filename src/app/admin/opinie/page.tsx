import { PinForm } from "@/components/PinForm";
import { npsScore, OPINION_QUESTIONS, type OpinionQuestion, type StoredAnswer } from "@/lib/opinions";
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
  const contacts = await fetchContacts();
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
              {OPINION_QUESTIONS.map((q) => <td key={q.id} style={cell}>{summary(rows, q)}</td>)}
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
    </main>
  );
}

interface ContactRow {
  id: string;
  created_at: string;
  retreat: string | null;
  name: string | null;
  email: string;
}

async function fetchContacts(): Promise<ContactRow[]> {
  const { data, error } = await serviceClient()
    .from("opinion_contacts").select("id, created_at, retreat, name, email").order("created_at", { ascending: false });
  check("opinion_contacts.select", error);
  return (data ?? []) as ContactRow[];
}

/** Średnia ocen z liczbą odpowiedzi, np. „4,3 (12)”; przy NPS dodatkowo wynik NPS. */
function summary(rows: OpinionRow[], q: OpinionQuestion): string {
  if (q.type === "text") return "";
  const values = rows.flatMap((r) => r.answers.filter((a) => a.id === q.id).map((a) => Number(a.answer)));
  if (values.length === 0) return "–";
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const text = `${avg.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} (${values.length})`;
  return q.type === "nps" ? `NPS ${npsScore(values)} · śr. ${text}` : text;
}

const cell: React.CSSProperties = { border: "1px solid #cfdcd7", padding: "6px 8px", verticalAlign: "top", textAlign: "left", whiteSpace: "pre-wrap", minWidth: 120 };

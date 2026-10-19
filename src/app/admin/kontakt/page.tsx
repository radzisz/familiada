import Link from "next/link";
import { PinForm } from "@/components/PinForm";
import { topicLabel } from "@/lib/contact";
import { isAdmin } from "@/lib/server/auth";
import { serviceClient } from "@/lib/server/db";
import { fetchContactRequests } from "@/lib/server/repo/contact";
import "@/components/admin/admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zapytania ze strony" };

const cell: React.CSSProperties = { border: "1px solid var(--ad-line)", padding: "6px 10px", textAlign: "left", verticalAlign: "top" };

/** Zapytania z formularza „Napisz do nas” na stronie Animatorni. */
export default async function ContactRequestsPage() {
  if (!(await isAdmin())) return <PinForm title="Zapytania ze strony" />;
  const rows = await fetchContactRequests(serviceClient());
  return (
    <main className="ad">
      <div className="ad-head">
        <h1>Zapytania ze strony <small>({rows.length})</small></h1>
        <div className="ad-nav">
          <Link href="/admin">Rozgrywki</Link>
          <Link href="/">Strona</Link>
        </div>
      </div>
      {rows.length === 0 ? <p className="ad-empty">Brak zapytań.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, background: "#fff" }}>
            <thead>
              <tr>{["Data", "Temat", "Imię", "E-mail", "Organizacja", "Wiadomość", "Strona"].map((h) => <th key={h} style={cell}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={cell}>{new Date(r.created_at).toLocaleString("pl-PL")}</td>
                  <td style={cell}>{topicLabel(r.topic)}</td>
                  <td style={cell}>{r.name ?? ""}</td>
                  <td style={cell}><a href={`mailto:${r.email}`}>{r.email}</a></td>
                  <td style={cell}>{r.organization ?? ""}</td>
                  <td style={{ ...cell, whiteSpace: "pre-wrap", minWidth: 260 }}>{r.message ?? ""}</td>
                  <td style={cell}>{r.source ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

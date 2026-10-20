"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import {
  CONTACT_CONSENT, CONTACT_LIMITS, contactRequestError, toolSubmissionError, toolSubmissionMessage, type ToolSubmission,
} from "@/lib/contact";

/** „Zgłoś narzędzie” na `/wspolpraca` – trafia do zapytań ze strony z tematem „narzedzie”. */
export function ToolSubmissionForm() {
  const [tool, setTool] = useState<ToolSubmission>({ toolName: "", url: "", own: true, description: "" });
  const [contact, setContact] = useState({ name: "", email: "", consent: false, website: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const setT = <K extends keyof ToolSubmission>(k: K, v: ToolSubmission[K]) => setTool((t) => ({ ...t, [k]: v }));
  const setC = <K extends keyof typeof contact>(k: K, v: (typeof contact)[K]) => setContact((c) => ({ ...c, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const request = {
      topic: "narzedzie" as const, organization: "", source: "wspolpraca",
      message: toolSubmissionMessage(tool), ...contact,
    };
    const invalid = toolSubmissionError(tool) ?? contactRequestError(request);
    if (invalid) return setError(invalid);
    setBusy(true);
    setError("");
    const res = await postJson("/api/kontakt", request);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="st-form st-sent" role="status">
        <p className="st-sent-title">Dziękujemy za zgłoszenie!</p>
        <p>Przyjrzymy się narzędziu i odezwiemy się na adres {contact.email.trim()}.</p>
      </div>
    );
  }

  return (
    <form className="st-form" onSubmit={submit} noValidate>
      <div className="st-radio" role="radiogroup" aria-label="Kto zgłasza">
        <label><input type="radio" checked={tool.own} onChange={() => setT("own", true)} /> Tworzę to narzędzie</label>
        <label><input type="radio" checked={!tool.own} onChange={() => setT("own", false)} /> Polecam cudze</label>
      </div>
      <div className="st-form-row">
        <label className="st-field">
          <span>Nazwa narzędzia <em>*</em></span>
          <input value={tool.toolName} maxLength={120} onChange={(e) => setT("toolName", e.target.value)} />
        </label>
        <label className="st-field">
          <span>Adres strony</span>
          <input type="url" value={tool.url} maxLength={300} placeholder="https://" onChange={(e) => setT("url", e.target.value)} />
        </label>
      </div>
      <label className="st-field">
        <span>Do czego się przydaje?</span>
        <textarea rows={4} value={tool.description} maxLength={2000}
          placeholder="Na jakich wydarzeniach się sprawdza, ile kosztuje, czym różni się od innych?"
          onChange={(e) => setT("description", e.target.value)} />
      </label>
      <div className="st-form-row">
        <label className="st-field">
          <span>Imię</span>
          <input value={contact.name} maxLength={CONTACT_LIMITS.name} autoComplete="name" onChange={(e) => setC("name", e.target.value)} />
        </label>
        <label className="st-field">
          <span>E-mail <em>*</em></span>
          <input type="email" required value={contact.email} maxLength={CONTACT_LIMITS.email} autoComplete="email"
            onChange={(e) => setC("email", e.target.value)} />
        </label>
      </div>
      <label className="st-hp" aria-hidden="true">
        Strona www
        <input tabIndex={-1} autoComplete="off" value={contact.website} onChange={(e) => setC("website", e.target.value)} />
      </label>
      <label className="st-consent">
        <input type="checkbox" checked={contact.consent} onChange={(e) => setC("consent", e.target.checked)} />
        <span>{CONTACT_CONSENT}</span>
      </label>
      {error && <p className="st-error" role="alert">{error}</p>}
      <button className="st-btn primary" disabled={busy}>{busy ? "Wysyłanie…" : "Zgłoś narzędzie"}</button>
    </form>
  );
}

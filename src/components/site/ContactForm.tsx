"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { CONTACT_CONSENT, CONTACT_LIMITS, CONTACT_TOPICS, contactRequestError, type ContactRequest, type ContactTopic } from "@/lib/contact";

/** „Napisz do nas” – na dole każdej strony Animatorni; `topic` ustawia narzędzie strony, z której przyszedł. */
export function ContactForm({ topic = "pakiet", source }: { topic?: ContactTopic; source: string }) {
  const [form, setForm] = useState<ContactRequest>({
    topic, name: "", email: "", organization: "", message: "", consent: false, source, website: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = <K extends keyof ContactRequest>(key: K, value: ContactRequest[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = contactRequestError(form);
    if (invalid) return setError(invalid);
    setBusy(true);
    setError("");
    const res = await postJson("/api/kontakt", form);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="st-form st-sent" role="status">
        <p className="st-sent-title">Dziękujemy! Wiadomość dotarła.</p>
        <p>Odpowiemy na adres {form.email.trim()}, zwykle w ciągu jednego–dwóch dni.</p>
      </div>
    );
  }

  return (
    <form className="st-form" onSubmit={submit} noValidate>
      <label className="st-field">
        <span>W czym możemy pomóc?</span>
        <select value={form.topic} onChange={(e) => set("topic", e.target.value as ContactTopic)}>
          {CONTACT_TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <div className="st-form-row">
        <label className="st-field">
          <span>Imię</span>
          <input value={form.name} maxLength={CONTACT_LIMITS.name} autoComplete="name" onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="st-field">
          <span>E-mail <em>*</em></span>
          <input type="email" required value={form.email} maxLength={CONTACT_LIMITS.email} autoComplete="email"
            onChange={(e) => set("email", e.target.value)} />
        </label>
      </div>
      <label className="st-field">
        <span>Wspólnota, parafia, firma <small>(opcjonalnie)</small></span>
        <input value={form.organization} maxLength={CONTACT_LIMITS.organization} autoComplete="organization"
          onChange={(e) => set("organization", e.target.value)} />
      </label>
      <label className="st-field">
        <span>Wiadomość</span>
        <textarea rows={4} value={form.message} maxLength={CONTACT_LIMITS.message}
          placeholder="Jakie wydarzenie planujesz, kiedy i dla ilu osób?" onChange={(e) => set("message", e.target.value)} />
      </label>
      <label className="st-hp" aria-hidden="true">
        Strona www
        <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
      </label>
      <label className="st-consent">
        <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} />
        <span>{CONTACT_CONSENT}</span>
      </label>
      {error && <p className="st-error" role="alert">{error}</p>}
      <button className="st-btn primary" disabled={busy}>{busy ? "Wysyłanie…" : "Wyślij"}</button>
    </form>
  );
}

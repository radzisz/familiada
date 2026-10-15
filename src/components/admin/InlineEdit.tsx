"use client";

import { useState, type FormEvent } from "react";
import { PencilIcon } from "./icons";

interface Props {
  label: string;
  value: string;
  /** Pokazywane zamiast pustej wartości (wyszarzone). */
  placeholder: string;
  maxLength: number;
  /** Zapis nowej wartości; zwraca komunikat błędu albo null, gdy się udało. */
  onSave: (next: string) => Promise<string | null>;
}

/** Wartość z małym ołówkiem obok; kliknięcie włącza edycję (Enter zapisuje, Esc anuluje). */
export function InlineEdit({ label, value, placeholder, maxLength, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = () => {
    setDraft(value);
    setError("");
    setEditing(true);
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    if (draft.trim() === value.trim()) return setEditing(false);
    setBusy(true);
    const problem = await onSave(draft.trim());
    setBusy(false);
    setError(problem ?? "");
    if (!problem) setEditing(false);
  }

  if (!editing) {
    return (
      <div className="ad-inline">
        <span className={value ? "ad-inline-value" : "ad-inline-value empty"}>{value || placeholder}</span>
        <button type="button" className="ad-icon ad-inline-edit" aria-label={`Edytuj: ${label}`} title="Edytuj" onClick={start}>
          <PencilIcon />
        </button>
      </div>
    );
  }
  return (
    <form className="ad-inline editing" onSubmit={(e) => void save(e)}>
      <input
        autoFocus aria-label={label} value={draft} maxLength={maxLength} disabled={busy} placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
      />
      <button type="submit" className="primary" disabled={busy}>Zapisz</button>
      <button type="button" disabled={busy} onClick={() => setEditing(false)}>Anuluj</button>
      {error && <p className="ad-error" role="alert">{error}</p>}
    </form>
  );
}

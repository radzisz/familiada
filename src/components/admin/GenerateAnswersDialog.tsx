"use client";

import { useRef, useState, type FormEvent } from "react";
import { postJson } from "@/lib/client/api";
import { eventUrl } from "@/lib/client/eventUrl";

const COUNTS = [10, 20, 40, 80] as const;
type Respondents = "all" | "wife" | "husband";
const RESPONDENTS: { value: Respondents; label: string }[] = [
  { value: "all", label: "wszyscy (na zmianę żony i mężowie)" },
  { value: "wife", label: "tylko żony" },
  { value: "husband", label: "tylko mężowie" },
];

interface Props {
  eventId: string;
  /** Napis na przycisku otwierającym okno. */
  label: string;
  /** Dla czego generujemy, np. „wszystkich pytań” – pokazane w oknie. */
  scope: string;
  /** Bez listy: wszystkie widoczne pytania. */
  questionIds?: string[];
  primary?: boolean;
  disabled?: boolean;
  onDone: () => Promise<void>;
}

/** Przycisk + okno potwierdzenia: ile testowych odpowiedzi i kto odpowiada, potem generowanie. */
export function GenerateAnswersDialog({ eventId, label, scope, questionIds, primary, disabled, onDone }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [count, setCount] = useState<number>(20);
  const [respondents, setRespondents] = useState<Respondents>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await postJson<{ added: number }>(eventUrl("/api/admin/test-answers", eventId), { count, respondents, questionIds });
    setBusy(false);
    setError(res.ok ? "" : res.error);
    if (!res.ok) return;
    setMessage(`Dodano ${res.data.added} testowych ankiet.`);
    dialogRef.current?.close();
    await onDone();
  }

  return (
    <>
      <button type="button" className={primary ? "primary" : undefined} disabled={disabled} onClick={() => dialogRef.current?.showModal()}>
        {label}
      </button>
      {message && <span className="ad-msg" aria-live="polite">{message}</span>}
      <dialog ref={dialogRef} className="ad-dialog" aria-label="Generowanie testowych odpowiedzi">
        <form className="ad-new-event" onSubmit={(e) => void submit(e)}>
          <h2>Wygenerować testowe odpowiedzi?</h2>
          <p className="ad-muted">Dla {scope}. Każda testowa ankieta odpowiada na część pytań, z literówkami i synonimami.</p>
          <label>
            <span>Ile ankiet</span>
            <select value={count} disabled={busy} onChange={(e) => setCount(Number(e.target.value))}>
              {COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label>
            <span>Kto</span>
            <select value={respondents} disabled={busy} onChange={(e) => setRespondents(e.target.value as Respondents)}>
              {RESPONDENTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          {error && <p className="ad-error" role="alert">{error}</p>}
          <div className="ad-dialog-actions">
            <button type="button" disabled={busy} onClick={() => dialogRef.current?.close()}>Anuluj</button>
            <button type="submit" className="primary" disabled={busy}>{busy ? "Generuję…" : "Wygeneruj"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}

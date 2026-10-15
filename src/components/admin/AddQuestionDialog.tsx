"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Audience } from "@/lib/types";
import { AudienceSelect } from "./AudienceSelect";

/** Najdłuższe pytanie (jak w bazie i w schemacie API). */
const QUESTION_MAX = 200;

/** Enter zatwierdza (pytanie to jedna linijka), Shift+Enter łamie wiersz. */
function submitOnEnter(e: KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key !== "Enter" || e.shiftKey) return;
  e.preventDefault();
  e.currentTarget.form?.requestSubmit();
}

/** Przycisk „+ Dodaj pytanie” przyklejony pod listą; pytanie wpisuje się w oknie (Esc lub „Anuluj” zamyka). */
export function AddQuestionDialog({ onAdd }: { onAdd: (text: string, audience: Audience) => Promise<boolean> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [busy, setBusy] = useState(false);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (text.trim() === "") return;
    setBusy(true);
    const ok = await onAdd(text.trim(), audience);
    setBusy(false);
    if (!ok) return;
    setText("");
    close();
  }

  return (
    <div className="ad-add-bar">
      <button type="button" className="primary" onClick={open}>+ Dodaj pytanie</button>
      <dialog ref={dialogRef} className="ad-dialog" aria-label="Nowe pytanie">
        <form className="ad-add-form" onSubmit={(e) => void submit(e)}>
          <h2>Nowe pytanie</h2>
          <label>
            Treść pytania
            <textarea
              value={text} maxLength={QUESTION_MAX} rows={3} autoFocus disabled={busy} onChange={(e) => setText(e.target.value)} onKeyDown={submitOnEnter}
              placeholder="np. Co mąż najczęściej gubi?"
            />
          </label>
          <label>
            Kto odpowiada
            <AudienceSelect value={audience} onChange={setAudience} />
          </label>
          <div className="ad-dialog-actions">
            <button type="button" onClick={close}>Anuluj</button>
            <button type="submit" className="primary" disabled={busy || text.trim() === ""}>Dodaj</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { useTwoStep } from "@/lib/client/useTwoStep";
import { eventUrl } from "@/lib/client/eventUrl";
import type { Overview } from "./types";

/** Licznik zgłoszeń na żywo. */
export function Counts({ counts }: { counts: Overview["counts"] }) {
  const { wife, husband } = counts;
  return (
    <div className="ad-counts" aria-live="polite">
      <div><span className="ad-num">{wife + husband}</span> zgłoszeń</div>
      <div className="w"><span className="ad-num">{wife}</span> żony</div>
      <div className="h"><span className="ad-num">{husband}</span> mężowie</div>
    </div>
  );
}

/** Otwieranie / zamykanie ankiety (zamknięcie wymaga drugiego kliknięcia); stan – plakietka w nagłówku. */
export function SurveyToggle({ overview, onChange }: { overview: Overview; onChange: () => Promise<void> }) {
  const open = overview.event.surveyOpen;
  const [error, setError] = useState("");

  async function setOpen(next: boolean) {
    const res = await postJson(eventUrl("/api/admin/survey", overview.event.id), { open: next });
    setError(res.ok ? "" : res.error);
    await onChange();
  }
  const close = useTwoStep(() => void setOpen(false));

  return (
    <>
      {open
        ? <button type="button" className="danger" onClick={close.click}>{close.armed ? "Kliknij ponownie, aby zamknąć" : "Zamknij ankietę"}</button>
        : <button type="button" onClick={() => void setOpen(true)}>Otwórz ankietę</button>}
      {error && <p className="ad-error" role="alert">{error}</p>}
    </>
  );
}

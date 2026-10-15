"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { useTwoStep } from "@/lib/client/useTwoStep";
import type { Overview } from "./types";

/** Licznik zgłoszeń na żywo i otwieranie / zamykanie ankiety. */
export function LiveBar({ overview, onChange }: { overview: Overview; onChange: () => Promise<void> }) {
  const { wife, husband } = overview.counts;
  const open = overview.event.surveyOpen;
  const [error, setError] = useState("");

  async function setOpen(next: boolean) {
    const res = await postJson("/api/admin/survey", { open: next });
    setError(res.ok ? "" : res.error);
    await onChange();
  }
  const close = useTwoStep(() => void setOpen(false));

  return (
    <section className="ad-panel ad-live" aria-label="Na żywo">
      <div className="ad-counts" aria-live="polite">
        <div><span className="ad-num">{wife + husband}</span> zgłoszeń</div>
        <div className="w"><span className="ad-num">{wife}</span> żony</div>
        <div className="h"><span className="ad-num">{husband}</span> mężowie</div>
      </div>
      <div className="ad-row">
        <span className={open ? "ad-badge ok" : "ad-badge off"}>{open ? "Ankieta otwarta" : "Ankieta zamknięta"}</span>
        {open
          ? <button type="button" className="danger" onClick={close.click}>{close.armed ? "Kliknij ponownie, aby zamknąć" : "Zamknij ankietę"}</button>
          : <button type="button" onClick={() => void setOpen(true)}>Otwórz ankietę ponownie</button>}
        <span className="ad-muted">{overview.event.name}</span>
      </div>
      {error && <p className="ad-error" role="alert">{error}</p>}
    </section>
  );
}

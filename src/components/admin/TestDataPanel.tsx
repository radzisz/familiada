"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";

interface ToggleProps {
  eventId: string;
  isTest: boolean;
  onChange: () => Promise<void>;
}

/** Włącza / wyłącza tryb testowy rozgrywki (PATCH rozgrywki). */
export function TestModeToggle({ eventId, isTest, onChange }: ToggleProps) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle(next: boolean) {
    setBusy(true);
    const res = await postJson(`/api/admin/events/${eventId}`, { isTest: next }, "PATCH");
    setError(res.ok ? "" : res.error);
    await onChange();
    setBusy(false);
  }

  return (
    <>
      <label className="ad-switch">
        <input type="checkbox" role="switch" checked={isTest} disabled={busy} onChange={(e) => void toggle(e.target.checked)} />
        <span className="ad-switch-track" aria-hidden="true" />
        {isTest ? "włączony" : "wyłączony"}
      </label>
      {error && <p className="ad-error" role="alert">{error}</p>}
    </>
  );
}

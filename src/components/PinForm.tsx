"use client";

import { Credits } from "@/components/Credits";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client/api";
import "./pin.css";

/** Logowanie prowadzącego PIN-em; po sukcesie odświeża stronę (cookie httpOnly). */
export function PinForm({ title }: { title: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await postJson("/api/login", { pin });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <main className="pin">
      <form className="pin-card" onSubmit={submit}>
        <h1>{title}</h1>
        <label htmlFor="pin">PIN prowadzącego</label>
        <input
          id="pin" type="password" inputMode="numeric" autoComplete="current-password" autoFocus
          value={pin} onChange={(e) => setPin(e.target.value)}
        />
        {error && <p className="pin-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy || pin === ""}>{busy ? "Sprawdzam…" : "Wejdź"}</button>
      </form>
      <Credits onDark />
    </main>
  );
}

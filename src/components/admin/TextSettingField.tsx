"use client";

import { useState } from "react";
import { postJson } from "@/lib/client/api";
import { InlineEdit } from "./InlineEdit";

interface Props {
  eventId: string;
  /** Pole w PATCH /api/admin/events/<id>. */
  field: "boardTitle" | "eventName";
  label: string;
  value: string;
  /** Co pokazać zamiast pustej wartości (np. domyślny tytuł). */
  placeholder: string;
  maxLength: number;
  onChange: () => Promise<void>;
}

/** Jedno pole tekstowe Ustawień rozgrywki edytowane w miejscu (ołówek obok wartości). */
export function TextSettingField(p: Props) {
  const [message, setMessage] = useState("");

  async function save(next: string): Promise<string | null> {
    const res = await postJson(`/api/admin/events/${p.eventId}`, { [p.field]: next }, "PATCH");
    if (!res.ok) return res.error;
    setMessage("Zapisano – otwarta tablica pokaże zmianę po odświeżeniu albo przy następnym „Dalej”.");
    await p.onChange();
    return null;
  }

  return (
    <div>
      <InlineEdit label={p.label} value={p.value} placeholder={p.placeholder} maxLength={p.maxLength} onSave={save} />
      {message && <span className="ad-msg" aria-live="polite">{message}</span>}
    </div>
  );
}

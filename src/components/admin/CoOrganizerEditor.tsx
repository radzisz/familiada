"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HOST_PARTNER, PARTNER_NAME_MAX, PARTNER_URL_MAX, type CoOrganizer } from "@/lib/branding";
import { postJson } from "@/lib/client/api";
import { TrashIcon } from "./icons";
import { InlineEdit } from "./InlineEdit";
import { LogoCropDialog } from "./LogoCropDialog";

/** Większych plików nie wczytujemy – logo i tak schodzi do 320×320. */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

interface Props {
  eventId: string;
  value: CoOrganizer | null;
  onChange: () => Promise<void>;
}

interface Draft {
  name: string;
  url: string;
  logo: string | null;
}

/** Adres strony: puste = brak, bez protokołu dopisujemy https://. */
function normalizeUrl(input: string): string | null {
  const url = input.trim();
  if (url === "") return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Co zapisać na serwerze: pełny współorganizator (nazwa + logo) albo null (nie pokazujemy go). */
function toSaved(d: Draft): CoOrganizer | null {
  return d.name.trim() && d.logo ? { name: d.name.trim(), url: normalizeUrl(d.url), logo: d.logo } : null;
}

/** Wybrany plik jako object URL do kadrowania; zwalniany przy zmianie i zamknięciu. */
function usePickedFile() {
  const [file, setFile] = useState<string | null>(null);
  useEffect(() => () => {
    if (file) URL.revokeObjectURL(file);
  }, [file]);
  return [file, setFile] as const;
}

/**
 * Współorganizator w Ustawieniach, edytowany w miejscu: logo (kafelek „Ustaw logo” / kubełek na obrazku),
 * nazwa i strona z ołówkiem. Każda zmiana zapisuje się od razu; bez nazwy albo logo współorganizatora nie pokazujemy.
 */
export function CoOrganizerEditor({ eventId, value, onChange }: Props) {
  const [draft, setDraft] = useState<Draft>({ name: value?.name ?? "", url: value?.url ?? "", logo: value?.logo ?? null });
  const [file, setFile] = usePickedFile();
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function persist(next: Draft): Promise<string | null> {
    setDraft(next);
    const res = await postJson(`/api/admin/events/${eventId}`, { coOrganizer: toSaved(next) }, "PATCH");
    setError(res.ok ? "" : res.error);
    await onChange();
    return res.ok ? null : res.error;
  }
  function pick(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) return setError("Plik jest za duży (najwyżej 15 MB).");
    setError("");
    setFile(URL.createObjectURL(f));
  }

  return (
    <div className="ad-co">
      <LogoTile logo={draft.logo} name={draft.name} onPick={() => inputRef.current?.click()} onRemove={() => void persist({ ...draft, logo: null })} />
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="ad-co-fields">
        <InlineEdit label="Nazwa współorganizatora" value={draft.name} placeholder="nazwa, np. Wspólnota Małżeństw" maxLength={PARTNER_NAME_MAX} onSave={(name) => persist({ ...draft, name })} />
        <InlineEdit label="Strona www współorganizatora" value={draft.url} placeholder="strona www (opcjonalnie)" maxLength={PARTNER_URL_MAX} onSave={(url) => persist({ ...draft, url })} />
        {!toSaved(draft) && <p className="ad-muted">Współorganizator pokaże się, gdy będzie miał nazwę i logo. Bez niego widać tylko logo {HOST_PARTNER.name}.</p>}
        {error && <p className="ad-error" role="alert">{error}</p>}
      </div>
      {file && <LogoCropDialog src={file} onCancel={() => setFile(null)} onDone={(logo) => { setFile(null); void persist({ ...draft, logo }); }} />}
    </div>
  );
}

/** Logo: bez obrazka – kafelek „Ustaw logo”; z obrazkiem – kubełek w rogu do usunięcia. */
function LogoTile(p: { logo: string | null; name: string; onPick: () => void; onRemove: () => void }) {
  if (!p.logo) {
    return <button type="button" className="ad-co-logo empty" onClick={p.onPick}>＋<br />Ustaw logo</button>;
  }
  return (
    <div className="ad-co-logo">
      <Image src={p.logo} alt={`Logo: ${p.name || "współorganizator"}`} width={120} height={120} unoptimized />
      <button type="button" className="ad-co-logo-remove" aria-label="Usuń logo" title="Usuń logo" onClick={p.onRemove}>
        <TrashIcon />
      </button>
    </div>
  );
}

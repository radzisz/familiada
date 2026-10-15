"use client";

import { useState } from "react";
import type { Audience } from "@/lib/types";
import { AudienceSelect } from "./AudienceSelect";
import { PencilIcon, RestoreIcon, TrashIcon } from "./icons";
import { AUDIENCE_LABEL, type OverviewQuestion } from "./types";

interface Props {
  q: OverviewQuestion;
  index: number;
  last: boolean;
  onMove: (delta: number) => void;
  onPatch: (body: { text?: string; audience?: Audience; hidden?: boolean }) => Promise<void>;
}

/** Definicja jednego pytania: treść, dla kogo, kolejność, ukrywanie (bez odpowiedzi). */
export function QuestionRow(p: Props) {
  const { q } = p;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(q.text);
  const [audience, setAudience] = useState<Audience>(q.audience);

  if (editing) {
    return (
      <li className="ad-q editing">
        <input value={text} maxLength={200} onChange={(e) => setText(e.target.value)} aria-label="Treść pytania" />
        <div className="ad-row">
          <AudienceSelect value={audience} onChange={setAudience} />
          <button type="button" onClick={() => void p.onPatch({ text, audience }).then(() => setEditing(false))}>Zapisz</button>
          <button type="button" onClick={() => setEditing(false)}>Anuluj</button>
        </div>
      </li>
    );
  }

  return (
    <li className={`ad-q${q.hidden ? " hid" : ""}`}>
      <div className="ad-q-main">
        <span className="ad-q-text">{p.index + 1}. {q.text}</span>
        <span className="ad-q-meta">
          <span className={`ad-aud ${q.audience}`}>{AUDIENCE_LABEL[q.audience]}</span>
          {q.hidden && <span className="ad-st none">ukryte – nie ma go w ankiecie</span>}
        </span>
      </div>
      <div className="ad-q-tools">
        <button type="button" aria-label="W górę" disabled={p.index === 0} onClick={() => p.onMove(-1)}>↑</button>
        <button type="button" aria-label="W dół" disabled={p.last} onClick={() => p.onMove(1)}>↓</button>
        <button type="button" className="ad-icon" aria-label="Edytuj pytanie" title="Edytuj" onClick={() => setEditing(true)}>
          <PencilIcon />
        </button>
        {q.hidden
          ? <button type="button" className="ad-icon" aria-label="Przywróć pytanie do ankiety" title="Przywróć" onClick={() => void p.onPatch({ hidden: false })}><RestoreIcon /></button>
          : <button type="button" className="ad-icon" aria-label="Usuń pytanie z ankiety" title="Usuń z ankiety" onClick={() => void p.onPatch({ hidden: true })}><TrashIcon /></button>}
      </div>
    </li>
  );
}

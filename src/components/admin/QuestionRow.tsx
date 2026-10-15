"use client";

import { useState } from "react";
import type { Audience } from "@/lib/types";
import { AudienceSelect } from "./AudienceSelect";
import { AUDIENCE_LABEL, type OverviewQuestion } from "./types";

interface Props {
  q: OverviewQuestion;
  index: number;
  last: boolean;
  selected: boolean;
  plan: string | null;
  onSelect: () => void;
  onMove: (delta: number) => void;
  onPatch: (body: { text?: string; audience?: Audience; hidden?: boolean }) => Promise<void>;
}

function status(q: OverviewQuestion): { text: string; cls: string } {
  if (q.answers === 0) return { text: "brak odpowiedzi", cls: "none" };
  if (q.ungrouped > 0) return { text: `niepogrupowane (${q.ungrouped})`, cls: "todo" };
  return { text: "pogrupowane", cls: "ok" };
}

export function QuestionRow(p: Props) {
  const { q } = p;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(q.text);
  const [audience, setAudience] = useState<Audience>(q.audience);
  const st = status(q);

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
    <li className={`ad-q${p.selected ? " sel" : ""}${q.hidden ? " hid" : ""}`}>
      <button type="button" className="ad-q-main" onClick={p.onSelect} aria-pressed={p.selected}>
        <span className="ad-q-text">{p.index + 1}. {q.text}</span>
        <span className="ad-q-meta">
          <span className={`ad-aud ${q.audience}`}>{AUDIENCE_LABEL[q.audience]}</span>
          <span>{q.answers} odp.</span>
          <span className={`ad-st ${st.cls}`}>{st.text}</span>
          {p.plan && <span className="ad-st plan">wybrane do gry: {p.plan}</span>}
          {q.hidden && <span className="ad-st none">ukryte</span>}
        </span>
      </button>
      <div className="ad-q-tools">
        <button type="button" aria-label="W górę" disabled={p.index === 0} onClick={() => p.onMove(-1)}>↑</button>
        <button type="button" aria-label="W dół" disabled={p.last} onClick={() => p.onMove(1)}>↓</button>
        <button type="button" onClick={() => setEditing(true)}>Edytuj</button>
        <button type="button" onClick={() => void p.onPatch({ hidden: !q.hidden })}>{q.hidden ? "Pokaż" : "Ukryj"}</button>
      </div>
    </li>
  );
}

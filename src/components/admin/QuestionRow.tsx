"use client";

import { useState } from "react";
import type { Audience } from "@/lib/types";
import { AudienceSelect } from "./AudienceSelect";
import { PencilIcon, RestoreIcon, TrashIcon } from "./icons";
import { AUDIENCE_LABEL, type OverviewQuestion } from "./types";

interface Props {
  q: OverviewQuestion;
  index: number;
  /** To pytanie jest teraz przeciągane. */
  dragging: boolean;
  onDragStart: () => void;
  /** Przeciągane pytanie jest nad tym wierszem (lista pokazuje podgląd nowej kolejności). */
  onDragOver: () => void;
  /** Koniec przeciągania (upuszczenie albo anulowanie) – zapis kolejności. */
  onDrop: () => void;
  /** Klawiatura na uchwycie: przesunięcie o jedno miejsce (-1 w górę, 1 w dół). */
  onNudge: (delta: number) => void;
  onPatch: (body: { text?: string; audience?: Audience; hidden?: boolean }) => Promise<void>;
}

/** Uchwyt do przeciągania; strzałki góra/dół na nim przesuwają pytanie bez myszy. */
function DragHandle({ onNudge }: { onNudge: (delta: number) => void }) {
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    onNudge(e.key === "ArrowUp" ? -1 : 1);
  };
  return (
    <button type="button" className="ad-drag" aria-label="Przeciągnij, aby zmienić kolejność (albo strzałki góra/dół)" title="Przeciągnij" onKeyDown={onKey}>
      ⠿
    </button>
  );
}

/** Definicja jednego pytania: treść, dla kogo, kolejność (przeciąganie), ukrywanie (bez odpowiedzi). */
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
    <li
      className={`ad-q ad-q-drag${q.hidden ? " hid" : ""}${p.dragging ? " dragging" : ""}`} draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", q.id);
        p.onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        p.onDragOver();
      }}
      onDrop={(e) => e.preventDefault()}
      onDragEnd={p.onDrop}
    >
      <DragHandle onNudge={p.onNudge} />
      <div className="ad-q-main">
        <span className="ad-q-text">{p.index + 1}. {q.text}</span>
        <span className="ad-q-meta">
          <span className={`ad-aud ${q.audience}`}>{AUDIENCE_LABEL[q.audience]}</span>
          {q.hidden && <span className="ad-st none">ukryte – nie ma go w ankiecie</span>}
        </span>
      </div>
      <div className="ad-q-tools">
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

"use client";

import { useState } from "react";
import type { GroupDetail } from "@/lib/detail";
import type { UniqueAnswer } from "@/lib/grouping";
import { EyeIcon, EyeOffIcon } from "./icons";

export type GroupOp =
  | { op: "move"; normalized: string; groupId: string }
  | { op: "moveNew"; normalized: string; label: string }
  | { op: "rename"; groupId: string; label: string }
  | { op: "hide"; groupId: string; hidden: boolean };

type NamedGroup = GroupDetail & { id: string };

interface Props {
  group: NamedGroup;
  groups: NamedGroup[];
  busy: boolean;
  onOp: (op: GroupOp) => Promise<void>;
}

const DRAG_TYPE = "text/plain";
const NEW_GROUP = "__new__";

/**
 * Jedna grupa: etykieta, licznik, ikona oka (ukryj / pokaż) i odpowiedzi z jednym poleceniem „przenieś do…”.
 * Grupa z jedną odpowiedzią to jeden wiersz – przeniesienie tej odpowiedzi łączy grupy
 * (pusta grupa znika po stronie serwera).
 */
export function GroupCard({ group, groups, busy, onOp }: Props) {
  const [over, setOver] = useState(false);
  const others = groups.filter((g) => g.id !== group.id);
  const single = group.members.length === 1 ? group.members[0] : null;
  const isOwn = (normalized: string) => group.members.some((m) => m.normalized === normalized);

  return (
    <article
      className={`ad-group${group.hidden ? " hid" : ""}${over ? " over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const normalized = e.dataTransfer.getData(DRAG_TYPE);
        if (normalized && !isOwn(normalized)) void onOp({ op: "move", normalized, groupId: group.id });
      }}
    >
      <header
        className={`ad-group-head${single ? " single" : ""}`}
        draggable={single !== null && !busy}
        onDragStart={(e) => single && e.dataTransfer.setData(DRAG_TYPE, single.normalized)}
      >
        <GroupLabel group={group} busy={busy} onOp={onOp} />
        <span className="ad-group-count">{group.count} os. · {group.points} pkt</span>
        {single && <MoveSelect member={single} others={others} canSplit={false} busy={busy} onOp={onOp} />}
        <button
          type="button" className="ad-icon ad-group-hide" disabled={busy}
          aria-label={group.hidden ? "Pokaż grupę na tablicy" : "Ukryj grupę z tablicy"} title={group.hidden ? "Pokaż" : "Ukryj"}
          onClick={() => void onOp({ op: "hide", groupId: group.id, hidden: !group.hidden })}
        >
          {group.hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </header>
      {!single && (
        <ul className="ad-members">
          {group.members.map((m) => (
            <li key={m.normalized} draggable={!busy} className="ad-member" onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, m.normalized)}>
              <span className="ad-member-text">{m.sampleRaw} <b className="ad-member-count">×{m.count}</b></span>
              <MoveSelect member={m} others={others} canSplit busy={busy} onOp={onOp} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/** Etykieta grupy edytowana w miejscu; zapis przy wyjściu z pola albo Enter. */
function GroupLabel({ group, busy, onOp }: Omit<Props, "groups">) {
  const [label, setLabel] = useState(group.label);
  const rename = () => {
    const next = label.trim();
    if (next === "" || next === group.label) return setLabel(group.label);
    void onOp({ op: "rename", groupId: group.id, label: next });
  };
  return (
    <input
      aria-label="Etykieta grupy" value={label} maxLength={60} disabled={busy}
      onChange={(e) => setLabel(e.target.value)} onBlur={rename}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
    />
  );
}

interface MoveProps {
  member: UniqueAnswer;
  others: NamedGroup[];
  canSplit: boolean;
  busy: boolean;
  onOp: (op: GroupOp) => Promise<void>;
}

/** Jedyne polecenie przy odpowiedzi: przenieś ją do innej (albo nowej) grupy. */
function MoveSelect({ member, others, canSplit, busy, onOp }: MoveProps) {
  const moveTo = (target: string) => {
    if (target === NEW_GROUP) return void onOp({ op: "moveNew", normalized: member.normalized, label: member.sampleRaw });
    if (target) void onOp({ op: "move", normalized: member.normalized, groupId: target });
  };
  return (
    <select aria-label={`Przenieś „${member.sampleRaw}” do grupy`} value="" disabled={busy || (others.length === 0 && !canSplit)} onChange={(e) => moveTo(e.target.value)}>
      <option value="">przenieś do…</option>
      {others.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
      {canSplit && <option value={NEW_GROUP}>➕ nowa grupa</option>}
    </select>
  );
}

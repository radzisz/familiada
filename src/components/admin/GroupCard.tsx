"use client";

import { useState } from "react";
import type { GroupDetail } from "@/lib/detail";
import type { UniqueAnswer } from "@/lib/grouping";

export type GroupOp =
  | { op: "move"; normalized: string; groupId: string }
  | { op: "moveNew"; normalized: string; label: string }
  | { op: "merge"; from: string; into: string }
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

/** Jedna grupa: etykieta, licznik, członkowie (przeciąganie / przenoszenie), scalanie, ukrywanie. */
export function GroupCard({ group, groups, busy, onOp }: Props) {
  const [label, setLabel] = useState(group.label);
  const [over, setOver] = useState(false);
  const others = groups.filter((g) => g.id !== group.id);

  const rename = () => {
    const next = label.trim();
    if (next === "" || next === group.label) return setLabel(group.label);
    void onOp({ op: "rename", groupId: group.id, label: next });
  };

  return (
    <article
      className={`ad-group${group.hidden ? " hid" : ""}${over ? " over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const normalized = e.dataTransfer.getData(DRAG_TYPE);
        if (normalized) void onOp({ op: "move", normalized, groupId: group.id });
      }}
    >
      <header className="ad-group-head">
        <input
          aria-label="Etykieta grupy" value={label} maxLength={60} disabled={busy}
          onChange={(e) => setLabel(e.target.value)} onBlur={rename}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
        <span className="ad-group-count">{group.count} os. · {group.points} pkt</span>
      </header>
      <ul className="ad-members">
        {group.members.map((m) => (
          <MemberChip key={m.normalized} member={m} others={others} canSplit={group.members.length > 1} busy={busy} onOp={onOp} />
        ))}
      </ul>
      <GroupFooter group={group} others={others} busy={busy} onOp={onOp} />
    </article>
  );
}

interface ChipProps {
  member: UniqueAnswer;
  others: NamedGroup[];
  canSplit: boolean;
  busy: boolean;
  onOp: (op: GroupOp) => Promise<void>;
}

/** Odpowiedź w grupie: można ją przeciągnąć albo przenieść listą do innej / nowej grupy. */
function MemberChip({ member, others, canSplit, busy, onOp }: ChipProps) {
  const moveTo = (target: string) => {
    if (target === NEW_GROUP) return void onOp({ op: "moveNew", normalized: member.normalized, label: member.sampleRaw });
    if (target) void onOp({ op: "move", normalized: member.normalized, groupId: target });
  };
  return (
    <li draggable={!busy} className="ad-chip" onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, member.normalized)}>
      <span>{member.sampleRaw} <b>×{member.count}</b></span>
      <select aria-label={`Przenieś „${member.sampleRaw}” do grupy`} value="" disabled={busy} onChange={(e) => moveTo(e.target.value)}>
        <option value="">przenieś do…</option>
        {others.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        {canSplit && <option value={NEW_GROUP}>➕ nowa grupa</option>}
      </select>
    </li>
  );
}

function GroupFooter({ group, others, busy, onOp }: Omit<Props, "groups"> & { others: NamedGroup[] }) {
  return (
    <footer className="ad-row">
      <select
        aria-label="Scal z grupą" value="" disabled={busy || others.length === 0}
        onChange={(e) => e.target.value && void onOp({ op: "merge", from: group.id, into: e.target.value })}
      >
        <option value="">scal z…</option>
        {others.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
      </select>
      <button type="button" disabled={busy} onClick={() => void onOp({ op: "hide", groupId: group.id, hidden: !group.hidden })}>
        {group.hidden ? "Pokaż na tablicy" : "Ukryj"}
      </button>
    </footer>
  );
}

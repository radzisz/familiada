"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PlanCandidate } from "@/lib/autoplan";
import { BOARD_SLOTS } from "@/lib/types";
import { AUDIENCE_LABEL, type OverviewQuestion } from "./types";

/** Statystyki pytania jako plakietki: liczba odpowiedzi, zapełnienie tablicy, lider, niepogrupowane. */
export function QuestionStats({ question, candidate }: { question: OverviewQuestion; candidate: PlanCandidate | undefined }) {
  const leader = candidate?.board[0]?.points ?? 0;
  return (
    <span className="ad-stats">
      <span className="ad-chip">{candidate?.respondents ?? question.answers} odp.</span>
      {candidate && <span className="ad-chip">{candidate.board.length}/{BOARD_SLOTS} na tablicy</span>}
      {candidate && leader > 0 && <span className="ad-chip">lider {leader} pkt</span>}
      {question.ungrouped > 0 && <span className="ad-chip warn">niepogrupowane: {question.ungrouped}</span>}
    </span>
  );
}

export interface PickerProps {
  label: string;
  value: string | null;
  options: OverviewQuestion[];
  candidates: Map<string, PlanCandidate>;
  /** Gdzie (w których slotach) użyto już danego pytania. */
  usedIn: Map<string, string[]>;
  busy: boolean;
  onPick: (value: string | null) => void;
}

function matches(q: OverviewQuestion, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return needle === "" || q.text.toLowerCase().includes(needle) || String(q.position) === needle;
}

/** Stan otwarcia listy; klik poza nią zamyka. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  return { open, setOpen, root };
}

/** Własna lista wyboru pytania (zamiast systemowego <select>): wyszukiwarka, statystyki, klawiatura. */
export function QuestionPicker(p: PickerProps) {
  const { open, setOpen, root } = usePopover();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const items = useMemo(() => [null, ...p.options.filter((q) => matches(q, query))], [p.options, query]);
  const current = p.options.find((q) => q.id === p.value);

  const pick = (q: OverviewQuestion | null) => {
    setOpen(false);
    setQuery("");
    if ((q?.id ?? null) !== p.value) p.onPick(q?.id ?? null);
  };
  const toggle = () => {
    setActive(Math.max(0, items.findIndex((q) => (q?.id ?? null) === p.value)));
    setOpen(!open);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item !== undefined) pick(item);
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const step = e.key === "ArrowDown" ? 1 : -1;
    setActive((a) => Math.min(items.length - 1, Math.max(0, a + step)));
  };

  return (
    <div className="ad-pick" ref={root}>
      <button
        type="button" className="ad-pick-btn" aria-haspopup="listbox" aria-expanded={open} disabled={p.busy}
        aria-label={`${p.label}: ${current ? current.text : "nie wybrano"}`} onClick={toggle}
      >
        {current
          ? <><span className="ad-pick-no">{current.position}.</span><span className="ad-pick-text">{current.text}</span></>
          : <span className="ad-pick-empty">Wybierz pytanie…</span>}
        <span className="ad-pick-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <PickerList
          {...p} items={items} active={active} query={query} onKey={onKey} onPick={pick} onHover={setActive}
          onQuery={(q) => { setQuery(q); setActive(0); }}
        />
      )}
    </div>
  );
}

interface ListProps extends Omit<PickerProps, "onPick"> {
  items: (OverviewQuestion | null)[];
  active: number;
  query: string;
  onKey: (e: React.KeyboardEvent) => void;
  onPick: (q: OverviewQuestion | null) => void;
  onHover: (i: number) => void;
  onQuery: (q: string) => void;
}

function PickerList(p: ListProps) {
  const listId = useId();
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    list.current?.children[p.active]?.scrollIntoView({ block: "nearest" });
  }, [p.active]);
  return (
    <div className="ad-pick-pop">
      <input
        autoFocus type="search" placeholder="Szukaj pytania (tekst albo numer)…" value={p.query}
        aria-label="Szukaj pytania" aria-controls={listId} aria-activedescendant={`${listId}-${p.active}`}
        onChange={(e) => p.onQuery(e.target.value)} onKeyDown={p.onKey}
      />
      <ul id={listId} role="listbox" aria-label={p.label} ref={list}>
        {p.items.map((q, i) => (
          <li
            key={q?.id ?? "none"} id={`${listId}-${i}`} role="option" aria-selected={(q?.id ?? null) === p.value}
            className={`ad-pick-opt${i === p.active ? " active" : ""}`}
            onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => p.onHover(i)} onClick={() => p.onPick(q)}
          >
            {q ? <OptionBody q={q} candidate={p.candidates.get(q.id)} used={p.usedIn.get(q.id) ?? []} /> : <span className="ad-pick-empty">— bez pytania —</span>}
          </li>
        ))}
        {p.items.length === 1 && <li className="ad-pick-none">Brak pytań pasujących do „{p.query}”.</li>}
      </ul>
    </div>
  );
}

function OptionBody({ q, candidate, used }: { q: OverviewQuestion; candidate: PlanCandidate | undefined; used: string[] }) {
  return (
    <>
      <span className="ad-pick-text"><b>{q.position}.</b> {q.text}</span>
      <span className="ad-pick-meta">
        <span className={`ad-chip aud-${q.audience}`}>{AUDIENCE_LABEL[q.audience]}</span>
        <QuestionStats question={q} candidate={candidate} />
        {used.length > 0 && <span className="ad-chip used">już w: {used.join(", ")}</span>}
      </span>
    </>
  );
}

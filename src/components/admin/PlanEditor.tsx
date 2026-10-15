"use client";

import type { PlanCandidate } from "@/lib/autoplan";
import { multiplier } from "@/lib/game";
import type { GamePlan } from "@/lib/types";
import { BoardPreview } from "./BoardPreview";
import { QuestionPicker, QuestionStats } from "./QuestionPicker";
import type { Overview, OverviewQuestion } from "./types";

const ROUND_THEMES = ["ogólne", "mężowie o żonach", "żony o mężach", "o małżeństwie", "na wesoło"];

interface Props {
  overview: Overview;
  candidates: Map<string, PlanCandidate>;
  busy: boolean;
  onSave: (plan: GamePlan) => void;
}

interface Slot {
  kind: keyof GamePlan;
  index: number;
  title: string;
}

const slotTitle = (kind: keyof GamePlan, index: number) => (kind === "rounds" ? `Runda ${index + 1}` : `Finał ${index + 1}`);

/** Dla każdego pytania: tytuły slotów, w których już jest (do ostrzeżeń o powtórkach). */
function usedSlots(plan: GamePlan): Map<string, string[]> {
  const used = new Map<string, string[]>();
  (["rounds", "final"] as const).forEach((kind) =>
    plan[kind].forEach((id, i) => {
      if (id) used.set(id, [...(used.get(id) ?? []), slotTitle(kind, i)]);
    }),
  );
  return used;
}

/** Przypisanie pytań do rund 1–5 (osobne karty) i 5 pytań finałowych (sekcja pod spodem). */
export function PlanEditor({ overview, candidates, busy, onSave }: Props) {
  const options = overview.questions.filter((q) => !q.hidden);
  const byId = new Map(overview.questions.map((q) => [q.id, q]));
  const usedIn = usedSlots(overview.plan);
  const setSlot = (slot: Slot, value: string | null) => {
    const next = { rounds: [...overview.plan.rounds], final: [...overview.plan.final] };
    next[slot.kind][slot.index] = value;
    onSave(next);
  };
  const card = (slot: Slot, tag: string, theme: string) => {
    const id = overview.plan[slot.kind][slot.index] ?? null;
    return (
      <SlotCard
        key={slot.title} slot={slot} tag={tag} theme={theme} value={id} options={options} candidates={candidates}
        usedIn={usedIn} busy={busy} question={id ? byId.get(id) : undefined} onPick={(v) => setSlot(slot, v)}
      />
    );
  };
  return (
    <div className="ad-plan">
      <section aria-label="Rundy">
        <h3>Rundy</h3>
        <div className="ad-slots">
          {ROUND_THEMES.map((theme, i) => card({ kind: "rounds", index: i, title: slotTitle("rounds", i) }, `×${multiplier(i + 1)}`, theme))}
        </div>
      </section>
      <section aria-label="Finał" className="ad-plan-final">
        <h3>Finał <small>krótkie pytania z wyraźnym liderem</small></h3>
        <div className="ad-slots">
          {overview.plan.final.map((_, i) => card({ kind: "final", index: i, title: slotTitle("final", i) }, "", `pytanie ${i + 1}`))}
        </div>
      </section>
    </div>
  );
}

interface CardProps {
  slot: Slot;
  tag: string;
  theme: string;
  value: string | null;
  options: OverviewQuestion[];
  candidates: Map<string, PlanCandidate>;
  usedIn: Map<string, string[]>;
  busy: boolean;
  question: OverviewQuestion | undefined;
  onPick: (value: string | null) => void;
}

function SlotCard(p: CardProps) {
  const candidate = p.value ? p.candidates.get(p.value) : undefined;
  const others = (p.value ? p.usedIn.get(p.value) ?? [] : []).filter((t) => t !== p.slot.title);
  return (
    <div className={`ad-slot${p.value ? "" : " empty"}`}>
      <div className="ad-slot-head">
        <h4>{p.slot.kind === "rounds" ? p.slot.title : "Finał"}</h4>
        {p.tag && <span className="ad-chip mult">{p.tag}</span>}
        <span className="ad-slot-theme">{p.theme}</span>
      </div>
      <QuestionPicker
        label={p.slot.title} value={p.value} options={p.options} candidates={p.candidates}
        usedIn={p.usedIn} busy={p.busy} onPick={p.onPick}
      />
      {p.question && <QuestionStats question={p.question} candidate={candidate} />}
      {others.length > 0 && <p className="ad-warn">To samo pytanie jest też w: {others.join(", ")}</p>}
      {candidate && <BoardPreview answers={candidate.board} />}
      {!p.value && <p className="ad-muted">Wybierz pytanie z listy albo użyj „Uzupełnij puste automatycznie”.</p>}
    </div>
  );
}

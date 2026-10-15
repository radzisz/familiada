"use client";

import type { QuestionFilter } from "@/lib/questionFilter";
import type { Audience } from "@/lib/types";

const OPTIONS: { value: Audience | null; label: string }[] = [
  { value: null, label: "Wszystkie" },
  { value: "all", label: "wszyscy" },
  { value: "wife", label: "żony" },
  { value: "husband", label: "mężowie" },
];

interface Props {
  filter: QuestionFilter;
  shown: number;
  total: number;
  onChange: (filter: QuestionFilter) => void;
}

/** Szybkie filtrowanie nad listą pytań: adresat (przyciski) i fragment treści. */
export function QuestionFilterBar({ filter, shown, total, onChange }: Props) {
  return (
    <div className="ad-qfilter" role="search">
      <div className="ad-qfilter-aud" role="group" aria-label="Kto odpowiada">
        {OPTIONS.map((o) => (
          <button
            key={o.label} type="button" aria-pressed={filter.audience === o.value}
            className={o.value ? `aud-${o.value}` : undefined} onClick={() => onChange({ ...filter, audience: o.value })}
          >
            {o.label}
          </button>
        ))}
      </div>
      <input
        type="search" aria-label="Szukaj pytania" placeholder="Szukaj…" value={filter.query}
        onChange={(e) => onChange({ ...filter, query: e.target.value })}
      />
      {shown !== total && <span className="ad-muted">{shown} z {total}</span>}
    </div>
  );
}

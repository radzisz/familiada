import { BOARD_SLOTS, type BoardAnswer } from "@/lib/types";

/** Podgląd wyniku pytania dokładnie tak, jak pojawi się na tablicy (top 6). */
export function BoardPreview({ answers }: { answers: BoardAnswer[] }) {
  if (answers.length === 0) return <p className="ad-muted">Brak odpowiedzi do pokazania na tablicy.</p>;
  const total = answers.reduce((sum, a) => sum + a.points, 0);
  return (
    <div className="ad-board" aria-label="Podgląd tablicy">
      {answers.slice(0, BOARD_SLOTS).map((a, i) => (
        <div key={`${a.label}-${i}`} className="ad-board-row">
          <span>{i + 1}.</span>
          <span className="ad-board-ans">{a.label}</span>
          <span>{a.points}</span>
        </div>
      ))}
      <div className="ad-board-sum">suma {total}</div>
    </div>
  );
}

"use client";

import { FINAL_TARGET, finalNextHint, finalPerson, finalTotal, NONE, WRONG, type GameAction, type GameState, type Person } from "@/lib/game";
import type { Board, BoardQuestion } from "@/lib/types";
import { FinalPicker } from "./FinalPicker";
import { UndoButton } from "./GameView";
import { LedCounter } from "./LedCounter";
import type { Sound } from "./sound";
import { useCountdown } from "./useCountdown";

interface Props {
  state: GameState;
  board: Board;
  hideHost: boolean;
  /** Pilot: zamiast podglądu wyników kafelki do wyboru odpowiedzi. */
  pilot: boolean;
  dispatch: (a: GameAction) => void;
  sound: Sound;
  onTogglePanel: () => void;
}

const TIMER_IDLE = 20;

/** Finał: na tablicy sam podgląd wyników, na pilocie wybór odpowiedzi; stoper i przyciski w panelu prowadzącego. */
export function FinalView({ state, board, hideHost, pilot, dispatch, sound, onTogglePanel }: Props) {
  const finals = board.final.map((q) => q?.answers ?? []);
  const total = finalTotal(state, finals);
  const left = useCountdown(state.timerEndsAt, sound.buzz);
  const person = finalPerson(state);
  return (
    <section>
      <div className="tb-ftotal">
        <div><div className="tb-hint">Razem (cel: {FINAL_TARGET})</div><LedCounter className={`val${total >= FINAL_TARGET ? " win" : ""}`} value={total} onStep={sound.tick} /></div>
        <div className={`tb-timer${left !== null && left <= 5 ? " low" : ""}`} aria-live="polite">{left ?? TIMER_IDLE}</div>
      </div>
      {pilot
        ? <FinalPicker state={state} questions={board.final} person={person} dispatch={dispatch} />
        : (
          <div className="tb-final">
            {(["p1", "p2"] as const).map((p) => <FinalColumn key={p} person={p} active={p === person} state={state} questions={board.final} />)}
          </div>
        )}
      {!hideHost && <FinalPanel state={state} dispatch={dispatch} onHide={pilot ? null : onTogglePanel} />}
    </section>
  );
}

/** Panel prowadzącego w finale (na dole, jak w rundach): „Wstecz” i „Dalej” – stoper osoby 1, osoba 2, stoper osoby 2. */
function FinalPanel({ state, dispatch, onHide }: { state: GameState; dispatch: (a: GameAction) => void; onHide: (() => void) | null }) {
  const hint = finalNextHint(state);
  return (
    <div className="tb-panel fit">
      <div className="tb-sections">
        <section className="tb-sec" aria-label="Nawigacja">
          <h3>Nawigacja</h3>
          <div className="tb-row">
            <UndoButton state={state} dispatch={dispatch} />
            {hint && (
              <button type="button" className="tb-next primary" onClick={() => dispatch({ type: "finalNext", now: Date.now() })}>
                Dalej →
                <small>{hint}</small>
              </button>
            )}
            {onHide && <button type="button" onClick={onHide}>Ukryj panel</button>}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Kolumna osoby na tablicy – tylko podgląd wyników, bez treści pytań (wybór odpowiedzi jest na pilocie). */
function FinalColumn(p: { person: Person; active: boolean; state: GameState; questions: (BoardQuestion | null)[] }) {
  const { person, state, questions } = p;
  return (
    <div className={`tb-fcol${p.active ? " active" : ""}`}>
      <h3>{person === "p1" ? "Osoba 1" : "Osoba 2"}</h3>
      {questions.map((q, k) => {
        const picked = state.final[person][k] ?? NONE;
        const answer = q && picked >= 0 ? q.answers[picked] : undefined;
        return (
          <div key={k} className="tb-frow">
            <span className={`tb-fans${picked === WRONG ? " wrong" : ""}`}>{answer ? answer.label : picked === WRONG ? "✗" : "—"}</span>
            <div className="tb-fp">{answer ? answer.points : 0}</div>
          </div>
        );
      })}
    </div>
  );
}

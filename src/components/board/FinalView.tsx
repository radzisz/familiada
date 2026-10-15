"use client";

import { useEffect, useRef, useState } from "react";
import { FINAL_TARGET, finalTotal, NONE, type GameAction, type GameState, type Person } from "@/lib/game";
import type { Board, BoardQuestion } from "@/lib/types";
import type { Sound } from "./sound";

interface Props {
  state: GameState;
  board: Board;
  hideHost: boolean;
  dispatch: (a: GameAction) => void;
  sound: Sound;
}

const TICK_MS = 200;
const TIMER_IDLE = 20;

/** Sekundy do końca stopera; buzz raz, gdy dojdzie do zera. */
function useCountdown(endsAt: number | null, sound: Sound): number | null {
  const [now, setNow] = useState(() => Date.now());
  const buzzedFor = useRef<number | null>(null);
  useEffect(() => {
    if (endsAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  const left = endsAt === null ? null : Math.max(0, Math.ceil((endsAt - now) / 1000));
  useEffect(() => {
    if (left === 0 && endsAt !== null && buzzedFor.current !== endsAt) {
      buzzedFor.current = endsAt;
      sound.buzz();
    }
  }, [left, endsAt, sound]);
  return left;
}

export function FinalView({ state, board, hideHost, dispatch, sound }: Props) {
  const finals = board.final.map((q) => q?.answers ?? []);
  const total = finalTotal(state, finals);
  const left = useCountdown(state.timerEndsAt, sound);
  return (
    <section>
      <div className="tb-ftotal">
        <div><div className="tb-hint">Razem (cel: {FINAL_TARGET})</div><div className={`val${total >= FINAL_TARGET ? " win" : ""}`}>{total}</div></div>
        <div className={`tb-timer${left !== null && left <= 5 ? " low" : ""}`} aria-live="polite">{left ?? TIMER_IDLE}</div>
        {!hideHost && (
          <div className="tb-row">
            <button type="button" className="primary" onClick={() => dispatch({ type: "timerStart", seconds: 20, now: Date.now() })}>Start 20 s</button>
            <button type="button" className="primary" onClick={() => dispatch({ type: "timerStart", seconds: 25, now: Date.now() })}>Start 25 s</button>
            <button type="button" onClick={() => dispatch({ type: "timerStop" })}>Stop</button>
          </div>
        )}
      </div>
      <div className="tb-final">
        {(["p1", "p2"] as const).map((person) => (
          <FinalColumn key={person} person={person} state={state} questions={board.final} hideHost={hideHost} dispatch={dispatch} />
        ))}
      </div>
      {!hideHost && (
        <div className="tb-panel">
          <p className="tb-hint">
            Pytania finałowe wybierasz w panelu /admin. Przy każdej odpowiedzi zaznacz, którą odpowiedź z tablicy podał
            gracz (albo „brak”). Osoba 2 nie może powtórzyć odpowiedzi osoby 1.
          </p>
          <div className="tb-row"><button type="button" onClick={() => dispatch({ type: "finalClear" })}>Wyczyść finał</button></div>
        </div>
      )}
    </section>
  );
}

interface ColumnProps {
  person: Person;
  state: GameState;
  questions: (BoardQuestion | null)[];
  hideHost: boolean;
  dispatch: (a: GameAction) => void;
}

function FinalColumn({ person, state, questions, hideHost, dispatch }: ColumnProps) {
  const name = person === "p1" ? "Osoba 1" : "Osoba 2";
  return (
    <div className="tb-fcol">
      <h3>{name}</h3>
      {questions.map((q, k) => {
        if (!q) return <p key={k} className="tb-fq">{k + 1}. (nie wybrano pytania)</p>;
        const picked = state.final[person][k] ?? NONE;
        const blocked = person === "p2" ? (state.final.p1[k] ?? NONE) : NONE;
        const answer = picked === NONE ? null : q.answers[picked];
        return (
          <div key={k}>
            <p className="tb-fq">{k + 1}. {q.text}</p>
            <div className="tb-frow">
              {hideHost
                ? <span className="tb-fans">{answer ? answer.label : "—"}</span>
                : (
                  <select
                    aria-label={`${name}, pytanie ${k + 1}`} value={picked}
                    onChange={(e) => dispatch({ type: "finalPick", person, question: k, answer: Number(e.target.value) })}
                  >
                    <option value={NONE}>— brak / 0 —</option>
                    {q.answers.map((a, i) => (
                      <option key={i} value={i} disabled={i === blocked}>{a.label} ({a.points})</option>
                    ))}
                  </select>
                )}
              <div className="tb-fp">{answer ? answer.points : 0}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { multiplier, potValue, type GameAction, type GameState } from "@/lib/game";
import { useTwoStep } from "@/lib/client/useTwoStep";
import { ROUND_COUNT, type Board, type BoardAnswer } from "@/lib/types";
import type { BoardFx } from "./useBoardEffects";

interface Props {
  state: GameState;
  board: Board;
  fx: BoardFx;
  hideHost: boolean;
  dispatch: (a: GameAction) => void;
  onTogglePanel: () => void;
}

export function GameView({ state, board, fx, hideHost, dispatch, onTogglePanel }: Props) {
  const question = board.rounds[state.round - 1] ?? null;
  const answers = question?.answers ?? [];
  const m = multiplier(state.round);
  return (
    <section>
      <div className="tb-scores">
        <div className="tb-team w"><span className="name">ŻONY</span><span className="pts">{state.scoreW}</span></div>
        <div className="tb-pot"><div className="lbl">Pula ×{m}</div><div className="val">{potValue(state, answers) * m}</div></div>
        <div className="tb-team h"><span className="name">MĘŻOWIE</span><span className="pts">{state.scoreH}</span></div>
      </div>
      <div className="tb-board">
        <div className="tb-round">Runda {state.round}{m > 1 ? ` · punkty ×${m}` : ""}</div>
        <p className="tb-qtext">{question ? question.text : "Nie wybrano pytania do tej rundy – przypisz je w panelu /admin"}</p>
        <div className="tb-slots">
          {answers.map((a, i) => (
            <Slot
              key={`${state.round}-${i}`} answer={a} index={i} shown={state.revealed.includes(i)}
              flip={fx.flipped === i}
              onClick={() => dispatch({ type: "reveal", index: i, slotCount: answers.length })}
            />
          ))}
        </div>
        <div className="tb-strikes" aria-live="polite">
          {Array.from({ length: state.strikes }, (_, i) => <span key={i}>X</span>)}
        </div>
        {fx.bigX > 0 && <div key={fx.bigX} className="tb-bigx show" aria-hidden="true">X</div>}
      </div>
      {!hideHost && <GamePanel state={state} answers={answers} dispatch={dispatch} onTogglePanel={onTogglePanel} />}
    </section>
  );
}

function Slot(p: { answer: BoardAnswer; index: number; shown: boolean; flip: boolean; onClick: () => void }) {
  const label = p.shown ? `${p.index + 1}. ${p.answer.label}, ${p.answer.points} punktów` : `Odkryj odpowiedź ${p.index + 1}`;
  return (
    <button
      type="button" className={`tb-slot${p.shown ? "" : " hidden"}${p.shown && p.flip ? " just" : ""}`}
      aria-label={label} onClick={p.onClick}
    >
      <span>{p.index + 1}.</span>
      <span className="ans">{p.shown ? p.answer.label : "•".repeat(14)}</span>
      <span className="p">{p.shown ? p.answer.points : "--"}</span>
    </button>
  );
}

interface PanelProps {
  state: GameState;
  answers: BoardAnswer[];
  dispatch: (a: GameAction) => void;
  onTogglePanel: () => void;
}

function GamePanel({ state, answers, dispatch, onTogglePanel }: PanelProps) {
  const reset = useTwoStep(() => dispatch({ type: "reset" }));
  const awarded = state.awarded.includes(state.round);
  return (
    <div className="tb-panel">
      <div className="tb-row">
        <label htmlFor="roundSel">Runda</label>
        <select id="roundSel" value={state.round} onChange={(e) => dispatch({ type: "setRound", round: Number(e.target.value) })}>
          {Array.from({ length: ROUND_COUNT }, (_, i) => (
            <option key={i} value={i + 1}>{i + 1} (×{multiplier(i + 1)})</option>
          ))}
        </select>
        {awarded && <span className="tb-hint">Pula tej rundy już przyznana.</span>}
      </div>
      <div className="tb-row">
        <button type="button" className="bad" onClick={() => dispatch({ type: "strike" })}>X (błąd)</button>
        <button type="button" onClick={() => dispatch({ type: "revealAll", slotCount: answers.length })}>Odkryj resztę</button>
        <button type="button" className="wife" disabled={awarded} onClick={() => dispatch({ type: "award", team: "w", answers })}>Pula dla Żon</button>
        <button type="button" className="husband" disabled={awarded} onClick={() => dispatch({ type: "award", team: "h", answers })}>Pula dla Mężów</button>
        <button type="button" disabled={state.round >= ROUND_COUNT} onClick={() => dispatch({ type: "next" })}>Następne pytanie →</button>
      </div>
      <div className="tb-row">
        <button type="button" onClick={reset.click}>{reset.armed ? "Kliknij ponownie, aby wyzerować" : "Wyzeruj wynik"}</button>
        <button type="button" onClick={onTogglePanel}>Ukryj panel</button>
        <p className="tb-hint">
          Skróty: <kbd>1</kbd>–<kbd>6</kbd> odkrywa odpowiedź, <kbd>X</kbd> błąd, <kbd>H</kbd> ukryj lub pokaż panel.
          Odpowiedź możesz też kliknąć na tablicy.
        </p>
      </div>
    </div>
  );
}

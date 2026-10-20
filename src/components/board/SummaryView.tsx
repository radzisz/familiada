"use client";

import { leader, type GameAction, type GameState, type Team } from "@/lib/game";
import { NextButton, NextHint, nextHintText, TEAM_NAME, UndoButton } from "./GameView";

interface Props {
  state: GameState;
  hideHost: boolean;
  dispatch: (a: GameAction) => void;
  onNext: () => void;
}

/** Podsumowanie po rundach, przed finałem: wyniki obu drużyn i zwycięzca, który gra w finale. */
export function SummaryView({ state, hideHost, dispatch, onNext }: Props) {
  const win = leader(state);
  const score = (team: Team) => (team === "w" ? state.scoreW : state.scoreH);
  return (
    <section className="tb-summary" aria-label="Podsumowanie rund">
      <h2 className="tb-summary-title">{win ? `WYGRYWAJĄ ${TEAM_NAME[win]}!` : "REMIS!"}</h2>
      <div className="tb-summary-scores">
        {(["w", "h"] as const).map((team) => (
          <div key={team} className={`tb-summary-team${team === win ? " win" : ""}`}>
            <div className="lbl">{TEAM_NAME[team]}</div>
            <div className="val">{score(team)}</div>
          </div>
        ))}
      </div>
      <p className="tb-event-name">{win ? `Do finału przechodzą ${TEAM_NAME[win]}` : "Do finału wybierzcie po jednej osobie z każdej drużyny"}</p>
      {!hideHost && (
        <div className="tb-panel fit">
          <div className="tb-row">
            <UndoButton state={state} dispatch={dispatch} />
            <NextButton state={state} highlight disabled={false} onNext={onNext} />
          </div>
          <NextHint text={nextHintText(state)} />
        </div>
      )}
    </section>
  );
}

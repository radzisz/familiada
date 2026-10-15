"use client";

import type { GameAction, GameState } from "@/lib/game";
import type { Branding } from "@/lib/branding";
import { UndoButton } from "./GameView";
import { PartnerLogos } from "./PartnerLogos";

interface Props {
  state: GameState;
  branding: Branding;
  hideHost: boolean;
  dispatch: (a: GameAction) => void;
}

/** Ekran końcowy po finale: „Dziękujemy!” i loga organizatorów. „Wstecz” wraca do finału. */
export function ThanksView({ state, branding, hideHost, dispatch }: Props) {
  return (
    <section className="tb-thanks" aria-label="Podziękowanie">
      <h2 className="tb-thanks-title">Dziękujemy!</h2>
      {branding.eventName && <p className="tb-event-name">{branding.eventName}</p>}
      <PartnerLogos partners={branding.partners} names />
      {!hideHost && (
        <div className="tb-panel fit">
          <div className="tb-row"><UndoButton state={state} dispatch={dispatch} /></div>
        </div>
      )}
    </section>
  );
}

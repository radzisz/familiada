"use client";

import Image from "next/image";
import type { GameAction, GameState } from "@/lib/game";
import { PARTNERS } from "@/lib/partners";
import { UndoButton } from "./GameView";

interface Props {
  state: GameState;
  hideHost: boolean;
  dispatch: (a: GameAction) => void;
}

/** Ekran końcowy po finale: „Dziękujemy!” i loga obu organizatorów. „Wstecz” wraca do finału. */
export function ThanksView({ state, hideHost, dispatch }: Props) {
  return (
    <section className="tb-thanks" aria-label="Podziękowanie">
      <h2 className="tb-thanks-title">Dziękujemy!</h2>
      <ul className="tb-thanks-logos">
        {PARTNERS.map((p) => (
          <li key={p.href}>
            <span className="tb-thanks-disc">
              <Image src={p.src} alt={`Logo: ${p.name}`} width={240} height={240} priority />
            </span>
            <span className="tb-thanks-name">{p.name}</span>
          </li>
        ))}
      </ul>
      {!hideHost && (
        <div className="tb-panel fit">
          <div className="tb-row"><UndoButton state={state} dispatch={dispatch} /></div>
        </div>
      )}
    </section>
  );
}

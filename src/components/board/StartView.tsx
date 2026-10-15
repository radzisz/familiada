"use client";

import type { GameAction } from "@/lib/game";
import type { Branding } from "@/lib/branding";
import { PartnerLogos } from "./PartnerLogos";

interface Props {
  /** Tytuł, nazwa wydarzenia i organizatorzy z Ustawień rozgrywki. */
  branding: Branding;
  hideHost: boolean;
  dispatch: (a: GameAction) => void;
}

/** Ekran startowy przed grą: tytuł i loga organizatorów; „Start” (pilot / panel) zaczyna rundę 1. */
export function StartView({ branding, hideHost, dispatch }: Props) {
  return (
    <section className="tb-start" aria-label="Ekran startowy">
      <h2 className="tb-start-title">{branding.title.toUpperCase()}</h2>
      {branding.eventName && <p className="tb-event-name">{branding.eventName}</p>}
      <PartnerLogos partners={branding.partners} names={false} className="tb-start-logos" />
      {!hideHost && (
        <button type="button" className="tb-next tb-start-btn" onClick={() => dispatch({ type: "start" })}>
          Start ▶
        </button>
      )}
    </section>
  );
}

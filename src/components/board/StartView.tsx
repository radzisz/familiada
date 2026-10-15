"use client";

import Image from "next/image";
import type { GameAction } from "@/lib/game";
import { PARTNERS } from "@/lib/partners";

interface Props {
  hideHost: boolean;
  dispatch: (a: GameAction) => void;
}

/** Ekran startowy przed grą: tytuł i loga organizatorów; „Start” (pilot / panel) zaczyna rundę 1. */
export function StartView({ hideHost, dispatch }: Props) {
  return (
    <section className="tb-start" aria-label="Ekran startowy">
      <h2 className="tb-start-title">FAMILIADA<br />MAŁŻEŃSKA</h2>
      <ul className="tb-thanks-logos tb-start-logos">
        {PARTNERS.map((p) => (
          <li key={p.href}>
            <span className="tb-thanks-disc">
              <Image src={p.src} alt={`Logo: ${p.name}`} width={240} height={240} priority />
            </span>
          </li>
        ))}
      </ul>
      {!hideHost && (
        <button type="button" className="tb-next tb-start-btn" onClick={() => dispatch({ type: "start" })}>
          Start ▶
        </button>
      )}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { NONE, type GameState, type Team } from "@/lib/game";
import { introMs, MAX_TURNIPS } from "./RoundIntro";
import type { Sound } from "./sound";

export interface ScoreGain {
  team: Team;
  amount: number;
  /** Rośnie przy każdym przyznaniu – zmiana klucza restartuje animację „+N”. */
  key: number;
}

/** Plansza przejścia (rzepki): ile ich jest, napis i klucz restartujący animację. */
export interface BoardIntro {
  count: number;
  label: string;
  key: number;
}

/** Plansza przy wejściu do nowej rundy (tyle rzepek, ile numer rundy) albo do finału; null = bez planszy. */
function introFor(before: GameState, state: GameState): Omit<BoardIntro, "key"> | null {
  if (state.view === "final" && before.view !== "final") return { count: MAX_TURNIPS, label: "FINAŁ" };
  if (state.view === "game" && state.round !== before.round) return { count: state.round, label: `RUNDA ${state.round}` };
  return null;
}

export interface BoardFx {
  /** Indeks ostatnio odkrytej odpowiedzi (do zapalania liter po kolei). */
  flipped: number | null;
  /** Licznik pokazań dużego X (zmiana klucza restartuje animację). */
  bigX: number;
  /** Ostatni przyrost punktów drużyny (do „+N” i rozbłysku pola drużyny). */
  gain: ScoreGain | null;
  /** Plansza przejścia do nowej rundy (rzepki); klucz restartuje animację. */
  intro: BoardIntro | null;
}

/** Jak długo trwa „+N” nad wynikiem drużyny (musi pasować do animacji tb-gain w board.css). */
const GAIN_MS = 2200;

/** Która drużyna zyskała punkty między dwoma stanami (spadki, np. zerowanie, pomijamy). */
function scoreGain(before: GameState, state: GameState, key: number): ScoreGain | null {
  if (state.scoreW > before.scoreW) return { team: "w", amount: state.scoreW - before.scoreW, key };
  if (state.scoreH > before.scoreH) return { team: "h", amount: state.scoreH - before.scoreH, key };
  return null;
}

/**
 * Dźwięki i animacje wynikają ze zmian stanu, a nie z kliknięć – dzięki temu rzutnik
 * reaguje także na akcje wykonane z telefonu prowadzącego.
 */
export function useBoardEffects(state: GameState | null, sound: Sound): BoardFx {
  const prev = useRef<GameState | null>(null);
  const [fx, setFx] = useState<BoardFx>({ flipped: null, bigX: 0, gain: null, intro: null });

  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (!before || !state) return;
    const shown = (g: GameState) => [...g.revealed, ...g.uncovered];
    const fresh = shown(state).filter((i) => !shown(before).includes(i));
    const scored = state.scoreW !== before.scoreW || state.scoreH !== before.scoreH;
    const picked = (["p1", "p2"] as const).some((p) =>
      state.final[p].some((a, k) => a !== NONE && a !== before.final[p][k]),
    );
    if (fresh.length > 0 || scored || picked) sound.ding();
    if (fresh.length === 1) setFx((f) => ({ ...f, flipped: fresh[0]! }));
    if (scored) setFx((f) => ({ ...f, gain: scoreGain(before, state, (f.gain?.key ?? 0) + 1) ?? f.gain }));
    if (state.strikes.w + state.strikes.h > before.strikes.w + before.strikes.h) {
      sound.buzz();
      setFx((f) => ({ ...f, bigX: f.bigX + 1 }));
    }
    if (state.timerEndsAt !== null && state.timerEndsAt !== before.timerEndsAt) sound.beep();
    const intro = introFor(before, state);
    if (intro) setFx((f) => ({ ...f, intro: { ...intro, key: (f.intro?.key ?? 0) + 1 } }));
  }, [state, sound]);

  // Po animacji chowamy „+N”, żeby nie odtwarzał się ponownie po powrocie z widoku finału.
  const gainKey = fx.gain?.key;
  useEffect(() => {
    if (gainKey === undefined) return;
    const timer = window.setTimeout(() => setFx((f) => (f.gain?.key === gainKey ? { ...f, gain: null } : f)), GAIN_MS);
    return () => window.clearTimeout(timer);
  }, [gainKey]);

  // Plansza rundy znika sama po animacji.
  const introKey = fx.intro?.key;
  const introCount = fx.intro?.count ?? 1;
  useEffect(() => {
    if (introKey === undefined) return;
    const clear = () => setFx((f) => (f.intro?.key === introKey ? { ...f, intro: null } : f));
    const timer = window.setTimeout(clear, introMs(introCount));
    return () => window.clearTimeout(timer);
  }, [introKey, introCount]);

  return fx;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { NONE, type GameState } from "@/lib/game";
import type { Sound } from "./sound";

export interface BoardFx {
  /** Indeks ostatnio odkrytej odpowiedzi (do animacji odwrócenia). */
  flipped: number | null;
  /** Licznik pokazań dużego X (zmiana klucza restartuje animację). */
  bigX: number;
}

/**
 * Dźwięki i animacje wynikają ze zmian stanu, a nie z kliknięć – dzięki temu rzutnik
 * reaguje także na akcje wykonane z telefonu prowadzącego.
 */
export function useBoardEffects(state: GameState | null, sound: Sound): BoardFx {
  const prev = useRef<GameState | null>(null);
  const [fx, setFx] = useState<BoardFx>({ flipped: null, bigX: 0 });

  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (!before || !state) return;
    const fresh = state.revealed.filter((i) => !before.revealed.includes(i));
    const scored = state.scoreW !== before.scoreW || state.scoreH !== before.scoreH;
    const picked = (["p1", "p2"] as const).some((p) =>
      state.final[p].some((a, k) => a !== NONE && a !== before.final[p][k]),
    );
    if (fresh.length > 0 || scored || picked) sound.ding();
    if (fresh.length === 1) setFx((f) => ({ ...f, flipped: fresh[0]! }));
    if (state.strikes > before.strikes) {
      sound.buzz();
      setFx((f) => ({ ...f, bigX: f.bigX + 1 }));
    }
    if (state.timerEndsAt !== null && state.timerEndsAt !== before.timerEndsAt) sound.beep();
  }, [state, sound]);

  return fx;
}

"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS = 200;

/**
 * Sekundy do `endsAt` (null = brak odliczania). `onEnd` woła raz na koniec – tylko jeśli
 * odliczanie było widać na tym ekranie (odświeżenie strony po czasie nie odpala dźwięku ponownie).
 */
export function useCountdown(endsAt: number | null, onEnd: () => void): number | null {
  const [now, setNow] = useState(() => Date.now());
  const sawRunning = useRef<number | null>(null);
  const endedFor = useRef<number | null>(null);

  useEffect(() => {
    if (endsAt === null) return;
    setNow(Date.now());
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      // Po końcu odliczania nie ma po co dalej tykać.
      if (t >= endsAt) window.clearInterval(timer);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const left = endsAt === null ? null : Math.max(0, Math.ceil((endsAt - now) / 1000));
  useEffect(() => {
    if (endsAt === null || left === null) return;
    if (left > 0) sawRunning.current = endsAt;
    if (left === 0 && sawRunning.current === endsAt && endedFor.current !== endsAt) {
      endedFor.current = endsAt;
      onEnd();
    }
  }, [left, endsAt, onEnd]);
  return left;
}

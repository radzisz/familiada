"use client";

import { useEffect, useId } from "react";

/** Odstęp między kolejnymi rzepkami i czas pokazywania pełnego rzędu przed zniknięciem planszy. */
const STEP_MS = 380;
const HOLD_MS = 2200;
/** Rzepki uciekają w prawo tyle przed końcem planszy (ucieczka trwa 0,8 s + wygaszenie tła) i co tyle ms jedna po drugiej. */
const EXIT_BEFORE_END_MS = 1100;
const EXIT_STAGGER_MS = 110;
/** Wpadanie z lewej trwa tyle – dźwięk gra przy lądowaniu (musi pasować do tb-turnip-in w board.css). */
const ENTER_MS = 900;

/** Najwięcej rzepek na planszy (finał). */
export const MAX_TURNIPS = 7;

/** Ile trwa plansza z `count` rzepkami (musi zgadzać się z animacją tb-intro w board.css). */
export function introMs(count: number): number {
  return count * STEP_MS + HOLD_MS;
}

/** Rzepka jak z czołówki Familiady (własny rysunek SVG): biało-różowa bulwa z ogonkiem i duże liście. */
function Turnip({ delay, exit }: { delay: number; exit: number }) {
  const id = useId();
  const timing = { "--d": `${delay}ms`, "--o": `${exit}ms` } as React.CSSProperties;
  return (
    <svg className="tb-turnip" viewBox="0 0 100 150" style={timing} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}b`} cx="62%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fbf8ef" /><stop offset=".45" stopColor="#f3dccb" />
          <stop offset=".8" stopColor="#e39a7f" /><stop offset="1" stopColor="#c8705e" />
        </radialGradient>
        <linearGradient id={`${id}l`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#2b7a35" /><stop offset=".6" stopColor="#4fae4a" /><stop offset="1" stopColor="#8fd77a" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}l)`} stroke="#1f5e28" strokeWidth=".8">
        <path d="M48 66 C30 54 12 44 5 28 C22 24 40 40 48 66 Z" />
        <path d="M52 66 C70 52 88 42 95 28 C78 24 60 40 52 66 Z" />
        <path d="M49 66 C37 46 28 24 31 8 C44 16 51 40 49 66 Z" />
        <path d="M51 66 C63 46 72 24 69 8 C56 16 49 40 51 66 Z" />
        <path d="M50 66 C43 42 42 18 51 2 C61 18 58 44 50 66 Z" />
      </g>
      <g stroke="#b9eaa0" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".7">
        <path d="M50 62 C49 44 49 24 51 8" /><path d="M47 62 C34 50 20 40 10 30" /><path d="M53 62 C66 50 80 40 90 30" />
      </g>
      <path d="M50 62 C22 62 12 88 22 106 C30 120 44 126 50 140 C56 126 70 120 78 106 C88 88 78 62 50 62 Z" fill={`url(#${id}b)`} />
      <path d="M50 139 Q51 145 49 150" stroke="#c8705e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="62" cy="80" rx="8" ry="5" fill="#fff" opacity=".55" />
    </svg>
  );
}

/** Kiedy (ms od startu planszy) rzepka nr `i` zaczyna uciekać w prawo – najpierw ta z prawej. */
function exitAt(count: number, i: number): number {
  return introMs(count) - EXIT_BEFORE_END_MS - (count - 1) * EXIT_STAGGER_MS + (count - 1 - i) * EXIT_STAGGER_MS;
}

interface IntroProps {
  /** Ile rzepek (runda: numer rundy, finał: MAX_TURNIPS). */
  count: number;
  /** Napis pod rzepkami, np. „RUNDA 3” albo „FINAŁ”. */
  label: string;
  onPop: () => void;
}

/** Plansza przejścia (runda / finał) na cały ekran: z lewej przylatują rzepki, skaczą, a na koniec uciekają w prawo. */
export function RoundIntro({ count, label, onPop }: IntroProps) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_TURNIPS) throw new Error(`RoundIntro: zła liczba rzepek ${count}`);
  useEffect(() => {
    const timers = Array.from({ length: count }, (_, i) => window.setTimeout(onPop, i * STEP_MS + ENTER_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [count, onPop]);
  return (
    <div className="tb-intro" style={{ animationDuration: `${introMs(count)}ms` }} aria-hidden="true">
      <div className="tb-intro-row">
        {Array.from({ length: count }, (_, i) => <Turnip key={i} delay={i * STEP_MS} exit={exitAt(count, i)} />)}
      </div>
      <div className="tb-intro-label">{label}</div>
    </div>
  );
}

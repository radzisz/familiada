"use client";

import { useEffect, useRef, useState } from "react";
import { countSteps } from "@/lib/countUp";

const STEP_MS = 45;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Wartość, która co STEP_MS przeskakuje o krok w stronę `target` (najwyżej MAX_COUNT_STEPS kroków). */
function useCountUp(target: number, onStep?: () => void): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const stepRef = useRef(onStep);
  useEffect(() => { stepRef.current = onStep; });

  useEffect(() => {
    const all = countSteps(shownRef.current, target);
    const steps = prefersReducedMotion() ? all.slice(-1) : all;
    if (steps.length === 0) return;
    let i = 0;
    const timer = window.setInterval(() => {
      const value = steps[i]!;
      shownRef.current = value;
      setShown(value);
      stepRef.current?.();
      i += 1;
      if (i >= steps.length) window.clearInterval(timer);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [target]);

  return shown;
}

interface Props {
  value: number;
  className: string;
  /** Wołane przy każdym przeskoku licznika (np. tyknięcie dźwięku). */
  onStep?: () => void;
}

/**
 * Liczba w stylu tablicy z żarówkami: nabija się do nowej wartości, a każda cyfra,
 * która się zmienia, podskakuje (klucz z wartością cyfry restartuje animację CSS).
 */
export function LedCounter({ value, className, onStep }: Props) {
  const shown = useCountUp(value, onStep);
  const digits = String(shown).split("");
  return (
    <span className={className}>
      <span className="tb-sr">{value}</span>
      {digits.map((d, i) => (
        <span key={`${digits.length - i}-${d}`} className="tb-digit" aria-hidden="true">{d}</span>
      ))}
    </span>
  );
}

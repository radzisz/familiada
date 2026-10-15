"use client";

import { useEffect, useState } from "react";

const ARM_MS = 4000;

/**
 * Potwierdzenie drugim kliknięciem (zamiast confirm()). Pierwsze kliknięcie uzbraja,
 * drugie w ciągu 4 s wykonuje akcję.
 */
export function useTwoStep(action: () => void): { armed: boolean; click: () => void } {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), ARM_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);
  const click = () => {
    if (!armed) return setArmed(true);
    setArmed(false);
    action();
  };
  return { armed, click };
}

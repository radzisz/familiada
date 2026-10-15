"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/client/api";
import { eventUrl } from "@/lib/client/eventUrl";
import type { Overview } from "./types";

const POLL_MS = 4000;

/** Dane panelu odświeżane co kilka sekund, dopóki panel jest otwarty. */
export function useOverview(eventId: string) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const res = await apiJson<Overview>(eventUrl("/api/admin/overview", eventId));
    // Przy chwilowym błędzie sieci zostaje ostatni widok, a nad nim komunikat.
    if (res.ok) setOverview(res.data);
    setError(res.ok ? "" : res.error);
  }, [eventId]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  return { overview, error, reload };
}

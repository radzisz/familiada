"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/client/api";
import type { Overview } from "./types";

const POLL_MS = 4000;

/** Dane panelu odświeżane co kilka sekund, dopóki panel jest otwarty. */
export function useOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const res = await apiJson<Overview>("/api/admin/overview");
    if (res.ok) {
      setOverview(res.data);
      setError("");
    } else {
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  return { overview, error, reload };
}

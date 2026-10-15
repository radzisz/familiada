"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, postJson } from "@/lib/client/api";
import { gameReducer, parseGameState, type GameAction, type GameState } from "@/lib/game";
import type { Board } from "@/lib/types";

const SAVE_DEBOUNCE_MS = 300;
const POLL_MS = 1000;

const same = (a: GameState, b: GameState) => JSON.stringify(a) === JSON.stringify(b);

/** Lokalny stan gry; każda akcja zapisuje go do `game_state` z opóźnieniem 300 ms. */
function useGameStore(gameUrl: string, setError: (e: string) => void) {
  const [state, setState] = useState<GameState | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const saveTimer = useRef<number | null>(null);

  const adopt = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /** Przyjmij stan z serwera, jeśli nie czekamy na własny zapis i serwer nie jest starszy. */
  const adoptRemote = useCallback((raw: unknown) => {
    const remote = parseGameState(raw);
    const local = stateRef.current;
    if (saveTimer.current !== null) return;
    if (!local || (remote.rev >= local.rev && !same(remote, local))) adopt(remote);
  }, [adopt]);

  const save = useCallback(async () => {
    saveTimer.current = null;
    const res = await postJson<{ ok: boolean; state?: unknown }>(gameUrl, { state: stateRef.current }, "PUT");
    if (!res.ok) return setError(`Nie zapisano stanu gry: ${res.error}`);
    setError("");
    if (!res.data.ok && res.data.state) adopt(parseGameState(res.data.state));
  }, [adopt, setError, gameUrl]);

  const dispatch = useCallback((action: GameAction) => {
    const current = stateRef.current;
    if (!current) return;
    const next = gameReducer(current, action);
    if (next === current) return;
    adopt(next);
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void save(), SAVE_DEBOUNCE_MS);
  }, [adopt, save]);

  return { state, adoptRemote, dispatch };
}

/**
 * Stan gry i pytania tablicy. Co sekundę sprawdza bazę – odświeżenie strony nic nie gubi,
 * a drugi ekran (np. /tablica/<id>?pilot=1 na telefonie) może sterować tą samą grą.
 */
export function useGameSync(eventId: string) {
  const gameUrl = `/api/game?event=${encodeURIComponent(eventId)}`;
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const { state, adoptRemote, dispatch } = useGameStore(gameUrl, setError);

  const reloadBoard = useCallback(async () => {
    const res = await apiJson<{ state: unknown; board: Board }>(`${gameUrl}&board=1`);
    if (!res.ok) return setError(res.error);
    setBoard(res.data.board);
    adoptRemote(res.data.state);
  }, [adoptRemote, gameUrl]);

  useEffect(() => {
    void reloadBoard();
    const timer = window.setInterval(async () => {
      const res = await apiJson<{ state: unknown }>(gameUrl);
      if (res.ok) adoptRemote(res.data.state);
      else setError(res.error);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [reloadBoard, adoptRemote, gameUrl]);

  return { state, board, error, dispatch, reloadBoard };
}

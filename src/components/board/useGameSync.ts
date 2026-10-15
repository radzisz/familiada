"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, postJson } from "@/lib/client/api";
import { openGameChannel } from "@/lib/client/gameChannel";
import { gameReducer, parseGameState, type GameAction, type GameState } from "@/lib/game";
import type { Board } from "@/lib/types";

/** Odpytywanie bazy: co sekundę bez Realtime, rzadziej, gdy kanał Realtime działa (wtedy to tylko zapas). */
const POLL_MS = 1000;
const POLL_LIVE_MS = 4000;

const same = (a: GameState, b: GameState) => JSON.stringify(a) === JSON.stringify(b);

type AnnounceRef = React.MutableRefObject<(rev: number) => void>;

/**
 * Lokalny stan gry; każda akcja od razu zapisuje go do `game_state` (bez opóźnienia) i ogłasza zapis innym ekranom.
 * Zapisy mogą się nakładać – serwer odrzuca starszy `rev`, więc kolejność dotarcia nie psuje stanu.
 */
function useGameStore(gameUrl: string, setError: (e: string) => void, announce: AnnounceRef) {
  const [state, setState] = useState<GameState | null>(null);
  const stateRef = useRef<GameState | null>(null);
  /** Ile własnych zapisów jest w drodze – wtedy nie przyjmujemy stanu z serwera (byłby starszy niż lokalny). */
  const inFlight = useRef(0);

  const adopt = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /** Przyjmij stan z serwera, jeśli nie czekamy na własny zapis i serwer nie jest starszy. */
  const adoptRemote = useCallback((raw: unknown) => {
    const remote = parseGameState(raw);
    const local = stateRef.current;
    if (inFlight.current > 0) return;
    if (!local || (remote.rev >= local.rev && !same(remote, local))) adopt(remote);
  }, [adopt]);

  const save = useCallback(async (sent: GameState) => {
    inFlight.current += 1;
    try {
      const res = await postJson<{ ok: boolean; state?: unknown }>(gameUrl, { state: sent }, "PUT");
      if (!res.ok) return setError(`Nie zapisano stanu gry: ${res.error}`);
      setError("");
      if (res.data.ok) return announce.current(sent.rev);
      // Serwer ma nowszy stan (np. z drugiego ekranu) – bierzemy go, chyba że lokalnie poszliśmy już dalej.
      const remote = res.data.state ? parseGameState(res.data.state) : null;
      if (remote && remote.rev >= (stateRef.current?.rev ?? -1)) adopt(remote);
    } finally {
      inFlight.current -= 1;
    }
  }, [adopt, setError, gameUrl, announce]);

  const dispatch = useCallback((action: GameAction) => {
    const current = stateRef.current;
    if (!current) return;
    const next = gameReducer(current, action);
    if (next === current) return;
    adopt(next);
    void save(next);
  }, [adopt, save]);

  const currentRev = useCallback(() => stateRef.current?.rev ?? -1, []);
  return { state, adoptRemote, dispatch, currentRev };
}

/** Kanał Realtime rozgrywki: podpina ogłaszanie własnych zapisów i woła `onRemoteSave` przy cudzych. Zwraca, czy działa. */
function useGameChannel(eventId: string, announce: AnnounceRef, onRemoteSave: (rev: number) => void): boolean {
  const [live, setLive] = useState(false);
  const handler = useRef(onRemoteSave);
  useEffect(() => { handler.current = onRemoteSave; });
  useEffect(() => {
    const channel = openGameChannel(eventId, (rev) => handler.current(rev), setLive);
    if (!channel) return;
    announce.current = channel.announce;
    return () => {
      announce.current = () => {};
      channel.close();
      setLive(false);
    };
  }, [eventId, announce]);
  return live;
}

/**
 * Stan gry i pytania tablicy. Zapis z pilota ogłaszany jest przez Realtime, więc tablica pobiera stan od razu;
 * odpytywanie bazy zostaje jako zapas – odświeżenie strony nic nie gubi.
 */
export function useGameSync(eventId: string) {
  const gameUrl = `/api/game?event=${encodeURIComponent(eventId)}`;
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const announce = useRef<(rev: number) => void>(() => {});
  const { state, adoptRemote, dispatch, currentRev } = useGameStore(gameUrl, setError, announce);

  const pull = useCallback(async () => {
    const res = await apiJson<{ state: unknown }>(gameUrl);
    if (res.ok) adoptRemote(res.data.state);
    else setError(res.error);
  }, [adoptRemote, gameUrl]);
  const live = useGameChannel(eventId, announce, (rev) => {
    if (rev > currentRev()) void pull();
  });

  const reloadBoard = useCallback(async () => {
    const res = await apiJson<{ state: unknown; board: Board }>(`${gameUrl}&board=1`);
    if (!res.ok) return setError(res.error);
    setBoard(res.data.board);
    adoptRemote(res.data.state);
  }, [adoptRemote, gameUrl]);

  useEffect(() => {
    void reloadBoard();
  }, [reloadBoard]);
  useEffect(() => {
    const timer = window.setInterval(() => void pull(), live ? POLL_LIVE_MS : POLL_MS);
    return () => window.clearInterval(timer);
  }, [pull, live]);

  return { state, board, error, dispatch, reloadBoard };
}

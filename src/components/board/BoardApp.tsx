"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameAction, GameState } from "@/lib/game";
import type { Board } from "@/lib/types";
import { FinalView } from "./FinalView";
import { GameView } from "./GameView";
import { createSound } from "./sound";
import { useBoardEffects } from "./useBoardEffects";
import { useGameSync } from "./useGameSync";
import "./board.css";

/** Skróty klawiszowe: 1–6 odkrywa, X błąd, H chowa panel prowadzącego. */
function useBoardKeys(
  state: GameState | null,
  board: Board | null,
  dispatch: (a: GameAction) => void,
  togglePanel: () => void,
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "h") return togglePanel();
      if (!state || state.view !== "game") return;
      const slotCount = board?.rounds[state.round - 1]?.answers.length ?? 0;
      if (/^[1-6]$/.test(key)) dispatch({ type: "reveal", index: Number(key) - 1, slotCount });
      if (key === "x") dispatch({ type: "strike" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, board, dispatch, togglePanel]);
}

function toggleFullscreen() {
  const action = document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
  action.catch((err: unknown) => console.warn("[board] fullscreen failed", err));
}

export function BoardApp({ pilot }: { pilot: boolean }) {
  const { state, board, error, dispatch, reloadBoard } = useGameSync();
  const sound = useMemo(() => createSound(pilot), [pilot]);
  const fx = useBoardEffects(state, sound);
  const [panelHidden, setPanelHidden] = useState(false);
  const hideHost = panelHidden && !pilot;
  useBoardKeys(state, board, dispatch, () => setPanelHidden((h) => !h));

  if (!state || !board) {
    return <main className="tb"><p className="tb-msg">{error || "Wczytywanie tablicy…"}</p></main>;
  }
  return (
    <main className={`tb${pilot ? " pilot" : ""}`}>
      <header className="tb-head">
        <h1>FAMILIADA MAŁŻEŃSKA</h1>
        <nav aria-label="Widoki" hidden={hideHost}>
          <button type="button" aria-pressed={state.view === "game"} onClick={() => dispatch({ type: "setView", view: "game" })}>Gra</button>
          <button type="button" aria-pressed={state.view === "final"} onClick={() => dispatch({ type: "setView", view: "final" })}>Finał</button>
          <button type="button" onClick={() => void reloadBoard()} title="Wczytaj ponownie pytania i punkty z panelu">Odśwież pytania</button>
          {!pilot && <button type="button" onClick={toggleFullscreen}>Pełny ekran</button>}
        </nav>
      </header>
      {error && !hideHost && <p className="tb-error" role="alert">{error}</p>}
      {state.view === "game"
        ? <GameView state={state} board={board} fx={fx} hideHost={hideHost} dispatch={dispatch} onTogglePanel={() => setPanelHidden((h) => !h)} />
        : <FinalView state={state} board={board} hideHost={hideHost} dispatch={dispatch} sound={sound} />}
    </main>
  );
}

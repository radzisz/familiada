"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameAction, GameState } from "@/lib/game";
import type { Board } from "@/lib/types";
import { FinalView } from "./FinalView";
import { GameView } from "./GameView";
import { StartView } from "./StartView";
import { ThanksView } from "./ThanksView";
import { createSound } from "./sound";
import { RoundIntro } from "./RoundIntro";
import { useBoardEffects } from "./useBoardEffects";
import { useGameSync } from "./useGameSync";
import "./board.css";

/** Skróty klawiszowe: 1–6 odkrywa, X błąd, Backspace cofa ostatnią akcję, H chowa panel prowadzącego. */
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
      if (e.key === "Backspace") return dispatch({ type: "undo" });
      if (!state || !state.started || state.view !== "game") return;
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

export function BoardApp({ eventId, pilot }: { eventId: string; pilot: boolean }) {
  const { state, board, error, dispatch, reloadBoard } = useGameSync(eventId);
  const sound = useMemo(() => createSound(pilot), [pilot]);
  const fx = useBoardEffects(state, sound);
  const [panelHidden, setPanelHidden] = useState(false);
  const hideHost = panelHidden && !pilot;
  useBoardKeys(state, board, dispatch, () => setPanelHidden((h) => !h));
  // „Dalej” wczytuje też od nowa pytania i punkty z panelu (zmiany w grupowaniu / wyborze pytań).
  const goNext = () => {
    if (!state || !board) return;
    dispatch({ type: "next", answers: board.rounds[state.round - 1]?.answers ?? [], now: Date.now() });
    void reloadBoard();
  };

  if (!state || !board) {
    return <main className="tb"><p className="tb-msg">{error || "Wczytywanie tablicy…"}</p></main>;
  }
  return (
    <main className={`tb${pilot ? " pilot" : ""}`}>
      <header className="tb-head">
        {/* Na ekranie startowym tytuł jest duży na środku – w nagłówku byłby powtórzeniem. */}
        <h1 className={state.started ? undefined : "tb-sr"}>{board.title.toUpperCase()}</h1>
        <nav aria-label="Widoki" hidden={hideHost}>
          {!pilot && <button type="button" onClick={toggleFullscreen}>Pełny ekran</button>}
        </nav>
      </header>
      {error && !hideHost && <p className="tb-error" role="alert">{error}</p>}
      {state.view === "game" && <GameView state={state} board={board} fx={fx} sound={sound} hideHost={hideHost} pilot={pilot} dispatch={dispatch} onNext={goNext} onTogglePanel={() => setPanelHidden((h) => !h)} />}
      {state.view === "final" && <FinalView state={state} board={board} hideHost={hideHost} pilot={pilot} dispatch={dispatch} sound={sound} onTogglePanel={() => setPanelHidden((h) => !h)} />}
      {state.view === "thanks" && <ThanksView state={state} branding={board} hideHost={hideHost} dispatch={dispatch} />}
      {/* Przed startem tablica stoi pod półprzezroczystą nakładką z tytułem i przyciskiem „Start”. */}
      {!state.started && <StartView branding={board} hideHost={hideHost} dispatch={dispatch} />}
      {!pilot && fx.intro && <RoundIntro key={fx.intro.key} count={fx.intro.count} label={fx.intro.label} onPop={sound.beep} />}
      {hideHost && (
        <button type="button" className="tb-showpanel" onClick={() => setPanelHidden(false)} title="Pokaż panel prowadzącego (H)">
          Pokaż panel
        </button>
      )}
    </main>
  );
}

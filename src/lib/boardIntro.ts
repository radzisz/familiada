import { assert } from "./assert";
import type { GameState } from "./game";

export type IntroKind = { kind: "round"; round: number } | { kind: "final" };

/**
 * Czy pokazać planszę z rzepkami: tylko przy przejściu do przodu – z rund do finału albo do następnej rundy.
 * Powrót (z podziękowań, z finału, „Wstecz” do poprzedniej rundy) nie uruchamia animacji.
 */
export function introFor(before: GameState, state: GameState): IntroKind | null {
  assert(Number.isInteger(state.round) && state.round >= 1, "introFor: bad round");
  // Start gry z ekranu startowego – plansza pierwszej rundy.
  if (!before.started && state.started) return { kind: "round", round: state.round };
  // Do finału wchodzi się z podsumowania rund (a ze starego zapisu – prosto z rund).
  if (state.view === "final") return before.view === "summary" || before.view === "game" ? { kind: "final" } : null;
  if (before.view !== "game") return null;
  if (state.view === "game" && state.round > before.round) return { kind: "round", round: state.round };
  return null;
}

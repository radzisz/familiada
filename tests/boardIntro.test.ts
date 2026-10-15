import { describe, expect, it } from "vitest";
import { introFor } from "@/lib/boardIntro";
import { initialGameState, type GameState } from "@/lib/game";

const at = (patch: Partial<GameState>): GameState => ({ ...initialGameState(), ...patch });

describe("introFor – plansza z rzepkami tylko przy przejściu do przodu", () => {
  it("shows the round intro when the game moves on to the next round", () => {
    expect(introFor(at({ round: 2 }), at({ round: 3 }))).toEqual({ kind: "round", round: 3 });
  });
  it("shows the final intro when the game moves from rounds to the final", () => {
    expect(introFor(at({ round: 5 }), at({ round: 5, view: "final" }))).toEqual({ kind: "final" });
  });
  it("stays quiet when coming back from the thanks screen to the final", () => {
    expect(introFor(at({ view: "thanks" }), at({ view: "final" }))).toBeNull();
  });
  it("stays quiet when coming back from the final or thanks to the rounds", () => {
    expect(introFor(at({ view: "final", round: 5 }), at({ view: "game", round: 5 }))).toBeNull();
    expect(introFor(at({ view: "thanks", round: 5 }), at({ view: "game", round: 1 }))).toBeNull();
  });
  it("stays quiet when going back a round (Wstecz)", () => {
    expect(introFor(at({ round: 3 }), at({ round: 2 }))).toBeNull();
  });
  it("stays quiet when nothing about the stage changes", () => {
    expect(introFor(at({ round: 2 }), at({ round: 2, strikes: { w: 1, h: 0 } }))).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { boardTitle, DEFAULT_BOARD_TITLE, storedBoardTitle } from "@/lib/boardTitle";
import { EventPatchSchema } from "@/lib/schemas";

describe("tytuł na tablicy", () => {
  it("falls back to the default when nothing is set", () => {
    expect(boardTitle(null)).toBe(DEFAULT_BOARD_TITLE);
    expect(boardTitle("   ")).toBe(DEFAULT_BOARD_TITLE);
  });
  it("uses the custom title, trimmed", () => {
    expect(boardTitle("  Familiada Rekolekcyjna ")).toBe("Familiada Rekolekcyjna");
  });
  it("stores an empty or default title as null, anything else trimmed", () => {
    expect(storedBoardTitle("")).toBeNull();
    expect(storedBoardTitle(` ${DEFAULT_BOARD_TITLE} `)).toBeNull();
    expect(storedBoardTitle(" Familiada 2027 ")).toBe("Familiada 2027");
  });
  it("PATCH accepts a board title (empty = back to default) and rejects a too long one", () => {
    expect(EventPatchSchema.safeParse({ boardTitle: "Familiada 2027" }).success).toBe(true);
    expect(EventPatchSchema.safeParse({ boardTitle: "" }).success).toBe(true);
    expect(EventPatchSchema.safeParse({ boardTitle: "x".repeat(61) }).success).toBe(false);
  });
});

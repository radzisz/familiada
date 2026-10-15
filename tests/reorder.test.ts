import { describe, expect, it } from "vitest";
import { moveItem } from "@/lib/reorder";

describe("moveItem", () => {
  it("moves an item down", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });
  it("moves an item up", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
  it("returns the same order when nothing moves", () => {
    const ids = ["a", "b"];
    expect(moveItem(ids, 1, 1)).toBe(ids);
  });
  it("does not mutate the input", () => {
    const ids = ["a", "b", "c"];
    moveItem(ids, 0, 2);
    expect(ids).toEqual(["a", "b", "c"]);
  });
  it("rejects indexes outside the list", () => {
    expect(() => moveItem(["a", "b"], -1, 0)).toThrow();
    expect(() => moveItem(["a", "b"], 0, 2)).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { countSteps, MAX_COUNT_STEPS } from "@/lib/countUp";

describe("countSteps", () => {
  it("counts up one by one for small gains", () => {
    expect(countSteps(10, 14)).toEqual([11, 12, 13, 14]);
  });
  it("caps the number of steps and always ends on the target", () => {
    const steps = countSteps(0, 270);
    expect(steps).toHaveLength(MAX_COUNT_STEPS);
    expect(steps.at(-1)).toBe(270);
    expect(steps.every((v, i) => i === 0 || v > steps[i - 1]!)).toBe(true);
  });
  it("returns nothing when the value does not change", () => {
    expect(countSteps(42, 42)).toEqual([]);
  });
  it("jumps straight down (reset, next round) instead of counting down", () => {
    expect(countSteps(150, 0)).toEqual([0]);
  });
  it("rejects invalid input", () => {
    expect(() => countSteps(Number.NaN, 3)).toThrow();
    expect(() => countSteps(0, 3, 0)).toThrow();
  });
});

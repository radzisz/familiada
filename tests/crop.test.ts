import { describe, expect, it } from "vitest";
import { clampCrop, cropRect, fitScale, INITIAL_CROP, ZOOM_MAX, ZOOM_MIN } from "@/lib/crop";

describe("fitScale", () => {
  it("fits the image diagonal into the circle inscribed in the view", () => {
    const image = { width: 300, height: 400 };
    const s = fitScale(image, 200);
    expect(Math.hypot(image.width * s, image.height * s)).toBeCloseTo(200);
  });

  it("rejects empty images", () => {
    expect(() => fitScale({ width: 0, height: 10 }, 200)).toThrow();
  });
});

describe("cropRect", () => {
  it("centers the image at zoom 1", () => {
    const r = cropRect({ width: 100, height: 100 }, INITIAL_CROP, 200, 200);
    expect(r.x + r.width / 2).toBeCloseTo(100);
    expect(r.y + r.height / 2).toBeCloseTo(100);
    expect(Math.hypot(r.width, r.height)).toBeCloseTo(200);
  });

  it("scales offsets and size from the view to the output", () => {
    const view = cropRect({ width: 100, height: 50 }, { zoom: 2, dx: 10, dy: -5 }, 200, 200);
    const out = cropRect({ width: 100, height: 50 }, { zoom: 2, dx: 10, dy: -5 }, 200, 400);
    expect(out).toEqual({ x: view.x * 2, y: view.y * 2, width: view.width * 2, height: view.height * 2 });
  });
});

describe("clampCrop", () => {
  it("keeps zoom in range and the image center inside the view", () => {
    expect(clampCrop({ zoom: 99, dx: 500, dy: -500 }, 200)).toEqual({ zoom: ZOOM_MAX, dx: 100, dy: -100 });
    expect(clampCrop({ zoom: 0, dx: 0, dy: 0 }, 200).zoom).toBe(ZOOM_MIN);
  });
});

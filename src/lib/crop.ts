import { assert } from "./assert";

/**
 * Kadrowanie logo do krążka: obrazek przesuwany i powiększany w kwadratowym okienku,
 * eksportowany jako kwadrat (białe tło) – na ankiecie i tablicy pokazywany w kole.
 */

export interface CropState {
  /** Powiększenie względem „mieści się w kole” (1 = całe logo widoczne w krążku). */
  zoom: number;
  /** Przesunięcie środka obrazka względem środka okienka, w pikselach okienka. */
  dx: number;
  dy: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 4;

export const INITIAL_CROP: CropState = { zoom: 1, dx: 0, dy: 0 };

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Skala, przy której cały obrazek mieści się w kole wpisanym w okienko (przekątna = średnica = bok okienka). */
export function fitScale(image: Size, view: number): number {
  assert(image.width > 0 && image.height > 0 && view > 0, "fitScale: sizes must be positive");
  return view / Math.hypot(image.width, image.height);
}

/** Stan po korekcie: powiększenie w granicach, środek obrazka nie wychodzi poza okienko. */
export function clampCrop(crop: CropState, view: number): CropState {
  const half = view / 2;
  return { zoom: clamp(crop.zoom, ZOOM_MIN, ZOOM_MAX), dx: clamp(crop.dx, -half, half), dy: clamp(crop.dy, -half, half) };
}

/** Gdzie narysować obrazek w kwadracie o boku `out` (okienko podglądu ma bok `view`). */
export function cropRect(image: Size, crop: CropState, view: number, out: number): Rect {
  assert(out > 0, "cropRect: output size must be positive");
  const k = out / view;
  const scale = fitScale(image, view) * crop.zoom;
  const width = image.width * scale;
  const height = image.height * scale;
  const x = view / 2 + crop.dx - width / 2;
  const y = view / 2 + crop.dy - height / 2;
  return { x: x * k, y: y * k, width: width * k, height: height * k };
}

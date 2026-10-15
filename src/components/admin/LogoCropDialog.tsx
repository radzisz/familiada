"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { PARTNER_LOGO_MAX } from "@/lib/branding";
import { clampCrop, cropRect, INITIAL_CROP, ZOOM_MAX, ZOOM_MIN, type CropState, type Size } from "@/lib/crop";

/** Bok okienka podglądu (px CSS) i wyjściowego logo (px). */
const VIEW = 260;
const OUT = 320;

interface Props {
  /** Adres wczytanego pliku (object URL) – zwalnia go wywołujący. */
  src: string;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}

/** Rysuje kadr na białym tle i zwraca data URL (WebP, a gdy przeglądarka nie umie – JPEG). */
function renderLogo(image: HTMLImageElement, size: Size, crop: CropState): string {
  const canvas = document.createElement("canvas");
  canvas.width = OUT;
  canvas.height = OUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Przeglądarka nie pozwala rysować obrazków (canvas).");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, OUT, OUT);
  const r = cropRect(size, crop, VIEW, OUT);
  ctx.drawImage(image, r.x, r.y, r.width, r.height);
  const webp = canvas.toDataURL("image/webp", 0.9);
  const url = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.9);
  if (url.length > PARTNER_LOGO_MAX) throw new Error("Logo po wykadrowaniu jest za duże.");
  return url;
}

/** Przeciąganie obrazka w okienku (mysz i palec) – przesuwa kadr. */
function useDrag(crop: CropState, setCrop: (c: CropState) => void) {
  const start = useRef<{ x: number; y: number; crop: CropState } | null>(null);
  return {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { x: e.clientX, y: e.clientY, crop };
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      const s = start.current;
      if (!s) return;
      setCrop(clampCrop({ ...s.crop, dx: s.crop.dx + e.clientX - s.x, dy: s.crop.dy + e.clientY - s.y }, VIEW));
    },
    onPointerUp() {
      start.current = null;
    },
  };
}

/** Okno kadrowania logo: przeciągnij obrazek, suwakiem powiększ; koło pokazuje, co zobaczą uczestnicy. */
export function LogoCropDialog({ src, onCancel, onDone }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [crop, setCrop] = useState<CropState>(INITIAL_CROP);
  const [error, setError] = useState("");
  const drag = useDrag(crop, setCrop);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function loaded(img: HTMLImageElement) {
    const ok = img.naturalWidth > 0 && img.naturalHeight > 0;
    if (ok) setSize({ width: img.naturalWidth, height: img.naturalHeight });
    else setError("Nie da się odczytać wymiarów obrazka – wybierz plik PNG albo JPG.");
  }
  function save() {
    if (!imageRef.current || !size) return;
    try {
      onDone(renderLogo(imageRef.current, size, crop));
    } catch (err) {
      console.warn("[logo crop]", err);
      setError(err instanceof Error ? err.message : "Nie udało się wykadrować logo.");
    }
  }

  const r = size ? cropRect(size, crop, VIEW, VIEW) : null;
  return (
    <dialog ref={dialogRef} className="ad-dialog ad-crop" aria-label="Kadrowanie logo" onCancel={onCancel}>
      <h2>Wykadruj logo</h2>
      <p className="ad-muted">Przeciągnij obrazek, suwakiem powiększ. Na ankiecie i tablicy widać to, co jest w kole.</p>
      <div className="ad-crop-view" style={{ width: VIEW, height: VIEW }} {...drag} onPointerCancel={drag.onPointerUp}>
        {/* eslint-disable-next-line @next/next/no-img-element -- lokalny plik (object URL) do kadrowania, nie zasób strony */}
        <img
          ref={imageRef} src={src} alt="Wczytane logo" draggable={false} onLoad={(e) => loaded(e.currentTarget)}
          onError={() => setError("To nie jest obrazek, który da się wczytać.")}
          style={r ? { left: r.x, top: r.y, width: r.width, height: r.height } : { visibility: "hidden" }}
        />
      </div>
      <ZoomSlider zoom={crop.zoom} onZoom={(zoom) => setCrop((c) => clampCrop({ ...c, zoom }, VIEW))} />
      {error && <p className="ad-error" role="alert">{error}</p>}
      <div className="ad-dialog-actions">
        <button type="button" onClick={() => setCrop(INITIAL_CROP)}>Wyśrodkuj</button>
        <button type="button" onClick={onCancel}>Anuluj</button>
        <button type="button" className="primary" disabled={!size} onClick={save}>Użyj tego kadru</button>
      </div>
    </dialog>
  );
}

function ZoomSlider({ zoom, onZoom }: { zoom: number; onZoom: (zoom: number) => void }) {
  return (
    <label className="ad-crop-zoom">
      Powiększenie
      <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.01} value={zoom} onChange={(e) => onZoom(Number(e.target.value))} />
    </label>
  );
}

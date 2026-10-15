"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** Pełny adres strony aplikacji: NEXT_PUBLIC_BASE_URL, a gdy go brak – adres, pod którym otwarto panel. */
export function absoluteUrl(path: string): string {
  if (!path.startsWith("/")) throw new Error(`absoluteUrl: ścieżka musi zaczynać się od „/”: ${path}`);
  const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  return `${base.replace(/\/+$/, "")}${path}`;
}

/** Kod QR (SVG) dla adresu; generowany lokalnie przez bibliotekę qrcode. */
export function useQrSvg(url: string): { svg: string; error: string } {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (url === "") return;
    let current = true;
    QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1 })
      .then((s) => { if (current) setSvg(s); })
      .catch((err: unknown) => {
        console.error("[qr]", err);
        if (current) setError("Nie udało się wygenerować kodu QR.");
      });
    return () => { current = false; };
  }, [url]);
  return { svg, error };
}

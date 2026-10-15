"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import "./qr.css";

/** Pełnoekranowy kod QR z linkiem do ankiety, czytelny z końca sali. */
export function QrScreen({ baseUrl }: { baseUrl: string | null }) {
  const [url, setUrl] = useState("");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const target = `${(baseUrl ?? window.location.origin).replace(/\/+$/, "")}/`;
    setUrl(target);
    QRCode.toString(target, { type: "svg", errorCorrectionLevel: "M", margin: 1 })
      .then(setSvg)
      .catch((err: unknown) => {
        console.error("[qr]", err);
        setError("Nie udało się wygenerować kodu QR.");
      });
  }, [baseUrl]);

  return (
    <main className="qr">
      <div className="qr-box" role="img" aria-label={`Kod QR do ankiety: ${url}`}>
        {/* SVG generowane lokalnie przez bibliotekę qrcode z naszego własnego adresu. */}
        {svg && <div className="qr-svg" dangerouslySetInnerHTML={{ __html: svg }} />}
        {error && <p className="qr-error">{error}</p>}
      </div>
      <div className="qr-text">
        <h1>Zeskanuj i zagraj!</h1>
        <p>Wybierz „Żona” albo „Mąż” i odpowiedz krótko na kilka pytań. Ankieta jest anonimowa.</p>
        <p>Wyniki zobaczymy wieczorem na Familiadzie.</p>
        <p className="qr-url">{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
      </div>
    </main>
  );
}

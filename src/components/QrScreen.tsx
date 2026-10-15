"use client";

import { useEffect, useState } from "react";
import { useQrSvg } from "@/lib/client/qr";
import "./qr.css";

export type QrTarget = "survey" | "pilot";

const PATHS: Record<QrTarget, (id: string) => string> = {
  survey: (id) => `/ankieta/${id}`,
  pilot: (id) => `/tablica/${id}?pilot=1`,
};

function QrText({ target, url }: { target: QrTarget; url: string }) {
  const shortUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (target === "pilot") {
    return (
      <div className="qr-text">
        <h1>Pilot prowadzącego</h1>
        <p>Zeskanuj telefonem operatora i wpisz PIN panelu. Na telefonie zobaczysz pytanie i wszystkie odpowiedzi – kliknięcie odkrywa je na tablicy.</p>
        <p>Nie pokazuj tego kodu widowni.</p>
        <p className="qr-url">{shortUrl}</p>
      </div>
    );
  }
  return (
    <div className="qr-text">
      <h1>Zeskanuj i zagraj!</h1>
      <p>Wybierz „Żona” albo „Mąż” i odpowiedz krótko na kilka pytań. Ankieta jest anonimowa.</p>
      <p>Wyniki zobaczymy wieczorem na Familiadzie.</p>
      <p className="qr-url">{shortUrl}</p>
    </div>
  );
}

/** Pełnoekranowy kod QR z linkiem do ankiety (czytelny z końca sali) albo do pilota prowadzącego. */
export function QrScreen({ baseUrl, eventId, target }: { baseUrl: string | null; eventId: string; target: QrTarget }) {
  const [url, setUrl] = useState("");
  const { svg, error } = useQrSvg(url);
  useEffect(() => {
    setUrl(`${(baseUrl ?? window.location.origin).replace(/\/+$/, "")}${PATHS[target](eventId)}`);
  }, [baseUrl, eventId, target]);

  return (
    <main className="qr">
      <div className="qr-box" role="img" aria-label={`Kod QR: ${url}`}>
        {/* SVG generowane lokalnie przez bibliotekę qrcode z naszego własnego adresu. */}
        {svg && <div className="qr-svg" dangerouslySetInnerHTML={{ __html: svg }} />}
        {error && <p className="qr-error">{error}</p>}
      </div>
      <QrText target={target} url={url} />
    </main>
  );
}

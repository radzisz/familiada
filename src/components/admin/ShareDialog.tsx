"use client";

import { useRef, useState } from "react";
import { absoluteUrl, useQrSvg } from "@/lib/client/qr";

interface Props {
  /** Napis na przycisku i tytuł okna. */
  label: string;
  /** Ścieżka strony, np. `/ankieta/<id>`. */
  path: string;
  /** Jedno zdanie pod tytułem: komu dać ten link. */
  hint: string;
  /** Pełnoekranowa wersja kodu (np. na rzutnik). */
  screenPath: string;
  className?: string;
}

/** Jeden przycisk zamiast „link” + „kod QR”: okno z kodem QR, adresem do skopiowania i linkami. */
export function ShareDialog({ label, path, hint, screenPath, className }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState("");
  const open = () => {
    setUrl(absoluteUrl(path));
    dialogRef.current?.showModal();
  };
  return (
    <>
      <button type="button" className={className ?? "ad-navbtn"} onClick={open}>{label}</button>
      <dialog ref={dialogRef} className="ad-dialog ad-share" aria-label={label}>
        {url && <ShareBody label={label} url={url} hint={hint} screenPath={screenPath} onClose={() => dialogRef.current?.close()} />}
      </dialog>
    </>
  );
}

function ShareBody(p: { label: string; url: string; hint: string; screenPath: string; onClose: () => void }) {
  const { svg, error } = useQrSvg(p.url);
  const [copied, setCopied] = useState("");
  const copy = () => {
    navigator.clipboard.writeText(p.url).then(
      () => setCopied("Skopiowano."),
      (err: unknown) => {
        console.warn("[share] clipboard failed", err);
        setCopied("Nie udało się skopiować – zaznacz adres i skopiuj ręcznie.");
      },
    );
  };
  return (
    <div className="ad-share-body">
      <h2>{p.label}</h2>
      <p className="ad-muted">{p.hint}</p>
      {/* SVG generowane lokalnie przez bibliotekę qrcode z naszego własnego adresu. */}
      {svg && <div className="ad-share-qr" role="img" aria-label={`Kod QR: ${p.url}`} dangerouslySetInnerHTML={{ __html: svg }} />}
      {error && <p className="ad-error">{error}</p>}
      <div className="ad-share-url">
        <input readOnly value={p.url} aria-label="Adres" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" onClick={copy}>Kopiuj</button>
      </div>
      {copied && <p className="ad-msg" role="status">{copied}</p>}
      <div className="ad-dialog-actions">
        <a className="ad-link" href={p.screenPath} target="_blank" rel="noreferrer">Kod na cały ekran ↗</a>
        <a className="ad-link" href={p.url} target="_blank" rel="noreferrer">Otwórz ↗</a>
        <button type="button" onClick={p.onClose}>Zamknij</button>
      </div>
    </div>
  );
}

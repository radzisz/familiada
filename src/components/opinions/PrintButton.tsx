"use client";

/** Drukowanie raportu – w oknie drukowania „Zapisz jako PDF” daje plik do wysłania. */
export function PrintButton() {
  return <button className="rp-print" onClick={() => window.print()}>Drukuj / zapisz PDF</button>;
}

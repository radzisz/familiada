/** Pobranie raportu jako gotowego pliku PDF (generowany na serwerze). */
export function PdfButton({ href }: { href: string }) {
  return <a className="rp-print" href={href} download>Pobierz PDF</a>;
}

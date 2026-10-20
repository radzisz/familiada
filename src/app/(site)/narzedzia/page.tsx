import type { Metadata } from "next";
import Link from "next/link";
import { Catalog } from "@/components/site/Catalog";
import { ContactSection } from "@/components/site/ToolPage";
import { PLATFORM } from "@/lib/site";
import { pageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = pageMetadata(
  "/narzedzia",
  `Katalog narzędzi – ${PLATFORM.name}`,
  "Sprawdzone narzędzia dla prowadzących wydarzenia: gry i quizy, ankiety, śpiewniki, zapisy na wyjazdy i materiały.",
);

export default function CatalogPage() {
  return (
    <main>
      <section className="st-hero st-page-hero">
        <div className="st-wrap">
          <p className="st-eyebrow">Katalog narzędzi</p>
          <h1>Narzędzia, które sprawdzają się na wydarzeniach</h1>
          <p className="st-lead">
            Nasze i cudze – wybrane pod kątem prowadzących rekolekcje, wyjazdy, obozy i spotkania.
            Znasz coś, czego tu brakuje? <Link href="/wspolpraca">Zgłoś narzędzie</Link>.
          </p>
        </div>
      </section>
      <section className="st-section st-catalog-section">
        <div className="st-wrap"><Catalog /></div>
      </section>
      <ContactSection source="narzedzia" />
    </main>
  );
}

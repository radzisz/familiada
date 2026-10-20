import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTiles } from "@/components/site/Catalog";
import { ContactSection, ToolCard } from "@/components/site/ToolPage";
import { CATALOG, PLATFORM, TOOLS } from "@/lib/site";
import { pageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = pageMetadata(
  "/",
  `${PLATFORM.name} – ${PLATFORM.tagline.toLowerCase()}`,
  "Sprawdzone narzędzia dla prowadzących rekolekcje, wyjazdy i spotkania: gry i quizy, ankiety, śpiewniki, " +
    "zapisy i materiały – nasze i polecane. Zgłoś własne narzędzie do katalogu.",
);

const AUDIENCE = [
  { title: "Rekolekcje i wspólnoty", text: "Oaza, duszpasterstwa, rekolekcje dla małżeństw i młodzieży, dni skupienia." },
  { title: "Wyjazdy i obozy", text: "Kolonie, obozy harcerskie, wyjazdy szkolne i parafialne, zielone szkoły." },
  { title: "Firmy i szkolenia", text: "Integracje, wyjazdy firmowe, szkolenia i konferencje." },
  { title: "Rodzina i przyjaciele", text: "Wesela, jubileusze, zjazdy rodzinne i klasowe." },
];

export default function HomePage() {
  return (
    <main>
      <p className="st-qr-note">
        Jesteś uczestnikiem? Link do ankiety dostaniesz od prowadzącego – zeskanuj kod QR wyświetlony na sali.
      </p>

      <section className="st-hero st-page-hero">
        <div className="st-wrap">
          <p className="st-eyebrow">{PLATFORM.name}</p>
          <h1>Katalog narzędzi<br />dla prowadzących wydarzenia</h1>
          <p className="st-lead">
            Gry na rzutniku, ankiety, śpiewniki, zapisy na wyjazdy, materiały. Zbieramy narzędzia, które sprawdzają się
            na rekolekcjach, obozach i spotkaniach – część tworzymy sami, resztę polecamy. Już {CATALOG.length} w katalogu.
          </p>
          <div className="st-actions">
            <Link className="st-btn primary" href="/narzedzia">Przeglądaj katalog</Link>
            <Link className="st-btn ghost" href="/wspolpraca#zglos">Zgłoś narzędzie</Link>
          </div>
        </div>
      </section>

      <section className="st-section st-section-tight">
        <div className="st-wrap">
          <h2>Czego szukasz?</h2>
          <CategoryTiles />
        </div>
      </section>

      <section className="st-section alt" id="nasze">
        <div className="st-wrap">
          <h2>Tworzymy też własne</h2>
          <p className="st-sub">
            Tam, gdzie brakowało nam dobrego narzędzia, zrobiliśmy je sami. Uczestnicy używają własnych telefonów –
            bez aplikacji i bez kont. Płacisz raz, za wydarzenie.
          </p>
          <div className="st-tools">
            {TOOLS.map((t) => <ToolCard key={t.slug} slug={t.slug} />)}
          </div>
        </div>
      </section>

      <section className="st-section">
        <div className="st-wrap">
          <h2>Dla kogo</h2>
          <div className="st-grid four">
            {AUDIENCE.map((a) => (
              <article key={a.title} className="st-card"><h3>{a.title}</h3><p>{a.text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="st-section st-band">
        <div className="st-wrap st-band-in">
          <div>
            <h2>Tworzysz albo polecasz narzędzie?</h2>
            <p className="st-sub">
              Katalog rośnie dzięki prowadzącym. Zgłoś narzędzie, które pomaga na wydarzeniach – swoje albo cudze.
            </p>
          </div>
          <Link className="st-btn primary" href="/wspolpraca">Współpraca</Link>
        </div>
      </section>

      <ContactSection source="home" />
    </main>
  );
}

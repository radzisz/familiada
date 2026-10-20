import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { ToolSubmissionForm } from "@/components/site/ToolSubmissionForm";
import { PLATFORM } from "@/lib/site";
import { pageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = pageMetadata(
  "/wspolpraca",
  `Współpraca – ${PLATFORM.name}`,
  "Zgłoś swoje narzędzie do katalogu Animatorni, poleć takie, które sprawdziło się na Twoich wydarzeniach, albo napisz o współpracy.",
);

const WAYS = [
  { title: "Tworzysz narzędzie", text: "Aplikację, grę, śpiewnik, system zapisów? Opisz je – jeśli przyda się prowadzącym, trafi do katalogu." },
  { title: "Polecasz narzędzie", text: "Coś sprawdziło się na Twoich rekolekcjach czy obozie? Podziel się – inni prowadzący skorzystają." },
  { title: "Prowadzisz wydarzenia", text: "Wspólnota, parafia, organizator wyjazdów – testujmy razem nowe narzędzia, zanim trafią do wszystkich." },
];

export default function CooperationPage() {
  return (
    <main>
      <section className="st-hero st-page-hero">
        <div className="st-wrap">
          <p className="st-eyebrow">Współpraca</p>
          <h1>Budujmy katalog razem</h1>
          <p className="st-lead">
            {PLATFORM.name} zbiera narzędzia dla prowadzących – nie tylko nasze. Najlepsze polecenia przychodzą od ludzi,
            którzy prowadzą wydarzenia na co dzień.
          </p>
        </div>
      </section>

      <section className="st-section st-section-tight">
        <div className="st-wrap">
          <div className="st-grid three">
            {WAYS.map((w) => <article key={w.title} className="st-card"><h3>{w.title}</h3><p>{w.text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="st-section alt" id="zglos">
        <div className="st-wrap st-split">
          <div>
            <h2>Zgłoś narzędzie</h2>
            <p className="st-sub">
              Każde zgłoszenie przeglądamy sami. Do katalogu trafiają narzędzia, które realnie pomagają na wydarzeniach.
            </p>
          </div>
          <ToolSubmissionForm />
        </div>
      </section>

      <section className="st-section st-contact" id="kontakt">
        <div className="st-wrap st-split">
          <div>
            <h2>Inny pomysł na współpracę?</h2>
            <p className="st-sub">Integracja, wspólne wydarzenie, patronat – napisz, porozmawiamy.</p>
          </div>
          <ContactForm topic="wspolpraca" source="wspolpraca" />
        </div>
      </section>
    </main>
  );
}

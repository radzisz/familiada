import type { Metadata } from "next";
import { ContactSection, Pricing, ToolCard } from "@/components/site/ToolPage";
import { HeroCollage } from "@/components/site/ToolVisual";
import { PLATFORM, TOOLS } from "@/lib/site";
import { pageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = pageMetadata(
  "/",
  `${PLATFORM.name} – ${PLATFORM.tagline.toLowerCase()}`,
  "Familiada z odpowiedziami uczestników, ankiety po wydarzeniu z raportem i śpiewnik na rzutniku. " +
    "Uczestnicy używają własnych telefonów – bez aplikacji i bez kont.",
);

const BENEFITS = [
  { title: "Zaangażuje grupę", text: "Uczestnicy nie tylko słuchają – odpowiadają, grają i śpiewają, każdy ze swojego telefonu." },
  { title: "Policzy za Ciebie", text: "Odpowiedzi, punkty, średnie i raporty liczą się same. Ty zajmujesz się ludźmi, nie arkuszem." },
  { title: "Działa od ręki", text: "Kod QR na rzutniku i gotowe. Uczestnicy nic nie instalują i nie zakładają kont." },
  { title: "Wygląda profesjonalnie", text: "Nazwa wydarzenia i logo organizatora na tablicy, w ankiecie i w raporcie." },
];

const AUDIENCE = [
  { title: "Rekolekcje i wspólnoty", text: "Oaza, duszpasterstwa, rekolekcje dla małżeństw i młodzieży, dni skupienia." },
  { title: "Wyjazdy i obozy", text: "Kolonie, obozy harcerskie, wyjazdy szkolne i parafialne, zielone szkoły." },
  { title: "Firmy i szkolenia", text: "Integracje, wyjazdy firmowe, szkolenia i konferencje." },
  { title: "Rodzina i przyjaciele", text: "Wesela, jubileusze, zjazdy rodzinne i klasowe." },
];

const DAY = [
  { when: "Rano", what: "Ankieta Familiady w telefonach – uczestnicy odpowiadają przy śniadaniu." },
  { when: "W ciągu dnia", what: "Śpiewnik na rzutniku podczas modlitwy czy przy ognisku." },
  { when: "Wieczorem", what: "Familiada na rzutniku z odpowiedziami Twojej grupy." },
  { when: "Na koniec", what: "Ankieta opinii i raport dla organizatorów następnego dnia." },
];

export default function HomePage() {
  return (
    <main>
      <p className="st-qr-note">
        Jesteś uczestnikiem? Link do ankiety dostaniesz od prowadzącego – zeskanuj kod QR wyświetlony na sali.
      </p>

      <section className="st-hero">
        <div className="st-wrap st-hero-in">
          <div>
            <p className="st-eyebrow">{PLATFORM.name}</p>
            <h1>Ty prowadzisz ludzi.<br />My bierzemy na siebie resztę.</h1>
            <p className="st-lead">
              Narzędzia dla prowadzących wydarzenia, wyjazdy i rekolekcje: gra na rzutniku z odpowiedziami Twojej grupy,
              ankiety z gotowym raportem i śpiewnik, z którego śpiewa cała sala. Uczestnicy używają własnych telefonów.
            </p>
            <div className="st-actions">
              <a className="st-btn primary" href="#narzedzia">Zobacz narzędzia</a>
              <a className="st-btn ghost" href="#kontakt">Napisz do nas</a>
            </div>
          </div>
          <HeroCollage />
        </div>
      </section>

      <section className="st-section">
        <div className="st-wrap">
          <h2>Co może dla Ciebie zrobić</h2>
          <div className="st-grid four">
            {BENEFITS.map((b) => (
              <article key={b.title} className="st-card"><h3>{b.title}</h3><p>{b.text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="st-section alt" id="narzedzia">
        <div className="st-wrap">
          <h2>Narzędzia</h2>
          <p className="st-sub">Każde działa samodzielnie. Razem tworzą program całego wydarzenia.</p>
          <div className="st-tools">
            {TOOLS.map((t) => <ToolCard key={t.slug} slug={t.slug} />)}
          </div>
        </div>
      </section>

      <section className="st-section">
        <div className="st-wrap st-split">
          <div>
            <h2>Jedno wydarzenie, wiele narzędzi</h2>
            <p className="st-sub">
              Tworzysz wydarzenie raz – z nazwą, logo i jednym kodem QR – i dokładasz do niego narzędzia, których potrzebujesz.
              Na przykład tak wygląda dzień rekolekcji:
            </p>
          </div>
          <ol className="st-timeline">
            {DAY.map((d) => <li key={d.when}><b>{d.when}</b><span>{d.what}</span></li>)}
          </ol>
        </div>
      </section>

      <section className="st-section alt">
        <div className="st-wrap">
          <h2>Dla kogo</h2>
          <div className="st-grid four">
            {AUDIENCE.map((a) => (
              <article key={a.title} className="st-card"><h3>{a.title}</h3><p>{a.text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <Pricing />

      <ContactSection source="home" />
    </main>
  );
}

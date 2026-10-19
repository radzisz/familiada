import Link from "next/link";
import type { ContactTopic } from "@/lib/contact";
import { TOOLS, toolBySlug, type ToolSlug } from "@/lib/site";
import { ContactForm } from "./ContactForm";
import { ToolVisual } from "./ToolVisual";

/** Landing jednego narzędzia – treść z `src/lib/site.ts`. */
export function ToolPage({ slug }: { slug: ToolSlug }) {
  const tool = toolBySlug(slug);
  const others = TOOLS.filter((t) => t.slug !== slug);
  return (
    <main style={{ "--st-accent": tool.accent } as React.CSSProperties}>
      <section className="st-hero st-tool-hero">
        <div className="st-wrap st-hero-in">
          <div>
            <p className="st-eyebrow">{tool.name}{tool.soon && <span className="st-soon">wkrótce</span>}</p>
            <h1>{tool.hero.title}</h1>
            <p className="st-lead">{tool.hero.lead}</p>
            <div className="st-actions">
              <a className="st-btn primary" href="#kontakt">{tool.soon ? "Chcę wiedzieć, gdy ruszy" : "Zapytaj o swoje wydarzenie"}</a>
              <a className="st-btn ghost" href="#jak">Jak to działa</a>
            </div>
          </div>
          <ToolVisual slug={slug} />
        </div>
      </section>

      <section className="st-section">
        <div className="st-wrap">
          <h2>Co dostajesz</h2>
          <div className="st-grid">
            {tool.features.map((f) => (
              <article key={f.title} className="st-card">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="st-section alt" id="jak">
        <div className="st-wrap">
          <h2>Jak to działa</h2>
          <ol className="st-steps">
            {tool.steps.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="st-section">
        <div className="st-wrap st-split">
          <div>
            <h2>Dla kogo</h2>
            <ul className="st-tags">{tool.audience.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <div>
            <h2>Pytania</h2>
            <dl className="st-faq">
              {tool.faq.map((f) => (
                <div key={f.q}><dt>{f.q}</dt><dd>{f.a}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {!tool.soon && <Pricing />}

      <section className="st-section alt">
        <div className="st-wrap">
          <h2>Połącz z innymi narzędziami</h2>
          <p className="st-sub">Jedno wydarzenie, jeden kod QR, ta sama oprawa – i taniej w pakiecie.</p>
          <div className="st-tools">
            {others.map((t) => <ToolCard key={t.slug} slug={t.slug} />)}
          </div>
        </div>
      </section>

      <ContactSection topic={slug} source={slug} />
    </main>
  );
}

export function ToolCard({ slug }: { slug: ToolSlug }) {
  const t = toolBySlug(slug);
  return (
    <Link href={`/${t.slug}`} className="st-tool" style={{ "--st-accent": t.accent } as React.CSSProperties}>
      <ToolVisual slug={t.slug} compact />
      <div className="st-tool-body">
        <p className="st-moment">{t.moment}</p>
        <h3>{t.name}{t.soon && <span className="st-soon">wkrótce</span>}</h3>
        <p>{t.short}</p>
        <span className="st-more">Zobacz więcej →</span>
      </div>
    </Link>
  );
}

export function Pricing() {
  return (
    <section className="st-section">
      <div className="st-wrap">
        <h2>Płacisz raz – za wydarzenie</h2>
        <p className="st-sub">Bez abonamentu i bez zobowiązań.</p>
        <div className="st-grid three">
          <article className="st-card">
            <h3>Przygotowanie – za darmo</h3>
            <p>Ustawiasz pytania, oprawę i sprawdzasz wszystko w trybie testowym, zanim cokolwiek zapłacisz.</p>
          </article>
          <article className="st-card">
            <h3>Wydarzenie – jednorazowo</h3>
            <p>Płacisz dopiero, gdy uruchamiasz wydarzenie dla uczestników. Cena zależy od liczby uczestników.</p>
          </article>
          <article className="st-card">
            <h3>Pakiet – taniej</h3>
            <p>Kilka narzędzi na jedno wydarzenie kosztuje mniej niż każde osobno.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function ContactSection({ topic, source }: { topic?: ContactTopic; source: string }) {
  return (
    <section className="st-section st-contact" id="kontakt">
      <div className="st-wrap st-split">
        <div>
          <h2>Napisz do nas</h2>
          <p className="st-sub">
            Opowiedz, jakie wydarzenie prowadzisz. Pomożemy dobrać narzędzia, przygotować pytania i podamy cenę.
          </p>
        </div>
        <ContactForm topic={topic} source={source} />
      </div>
    </section>
  );
}

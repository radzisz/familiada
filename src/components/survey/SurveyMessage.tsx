import Image from "next/image";
import "./survey.css";

export function SurveyShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="sv">
      <div className="sv-card">
        <p className="sv-brand">Familiada małżeńska</p>
        {children}
        <SurveyFooter />
      </div>
    </main>
  );
}

const PARTNERS = [
  { href: "https://youngtree.org/", src: "/logos/youngtree.png", name: "Fundacja YoungTree" },
  { href: "https://wspolnotamalzenstw.pl/", src: "/logos/wspolnota-malzenstw.png", name: "Wspólnota Małżeństw" },
] as const;

function SurveyFooter() {
  return (
    <footer className="sv-footer">
      <p className="sv-footer-title">Rekolekcje dla małżeństw · Kraków 2026</p>
      <ul className="sv-partners">
        {PARTNERS.map((p) => (
          <li key={p.href}>
            <a href={p.href} target="_blank" rel="noopener noreferrer">
              <Image src={p.src} alt={`Logo: ${p.name}`} width={72} height={72} />
              <span>{p.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}

export function SurveyMessage({ title, text }: { title: string; text: string }) {
  return (
    <SurveyShell>
      <h1 className="sv-title">{title}</h1>
      <p className="sv-text">{text}</p>
    </SurveyShell>
  );
}

import Link from "next/link";
import { Credits } from "@/components/Credits";
import { PLATFORM, TOOLS } from "@/lib/site";

export function Logo() {
  return (
    <Link href="/" className="st-logo">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--st-green)" />
        <path d="M16 6c3 4 6 7 6 11a6 6 0 0 1-12 0c0-2 1-4 2-5 0 2 1 3 2 3 0-3 0-6 2-9z" fill="var(--st-gold-2)" />
      </svg>
      {PLATFORM.name}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="st-header">
      <div className="st-wrap st-header-in">
        <Logo />
        <nav className="st-nav" aria-label="Narzędzia">
          {TOOLS.map((t) => <Link key={t.slug} href={`/${t.slug}`}>{t.name}</Link>)}
        </nav>
        <a className="st-btn small" href="#kontakt">Napisz do nas</a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="st-footer">
      <div className="st-wrap st-footer-in">
        <div>
          <Logo />
          <p>{PLATFORM.tagline}.</p>
        </div>
        <nav aria-label="Narzędzia w stopce">
          <p className="st-footer-h">Narzędzia</p>
          {TOOLS.map((t) => <Link key={t.slug} href={`/${t.slug}`}>{t.name}{t.soon ? " (wkrótce)" : ""}</Link>)}
        </nav>
        <nav aria-label="Kontakt">
          <p className="st-footer-h">Kontakt</p>
          <a href="#kontakt">Napisz do nas</a>
          <Link href="/admin">Panel prowadzącego</Link>
        </nav>
      </div>
      <div className="st-wrap"><Credits /></div>
    </footer>
  );
}

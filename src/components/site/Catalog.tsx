import Link from "next/link";
import { CATEGORIES, catalogByCategory, toolBySlug, type CatalogEntry } from "@/lib/site";

/** Katalog narzędzi: sekcja na kategorię, nasze narzędzia pierwsze w każdej z nich. */
export function Catalog() {
  return (
    <div className="st-catalog">
      <nav className="st-chips" aria-label="Kategorie">
        {CATEGORIES.map((c) => <a key={c.slug} href={`#${c.slug}`}>{c.name}</a>)}
      </nav>
      {CATEGORIES.map((c) => (
        <section key={c.slug} id={c.slug} className="st-cat">
          <h2>{c.name}</h2>
          <p className="st-sub">{c.text}</p>
          <div className="st-entries">
            {catalogByCategory(c.slug).map((e) => <CatalogCard key={e.name} entry={e} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Kategorie jako kafelki – wejście do katalogu ze strony głównej. */
export function CategoryTiles() {
  return (
    <div className="st-grid three st-cat-tiles">
      {CATEGORIES.map((c) => (
        <Link key={c.slug} href={`/narzedzia#${c.slug}`} className="st-card st-cat-tile">
          <h3>{c.name}</h3>
          <p>{c.text}</p>
          <span className="st-cat-names">{catalogByCategory(c.slug).map((e) => e.name).join(" · ")}</span>
        </Link>
      ))}
      <Link href="/wspolpraca" className="st-card st-cat-tile st-cat-add">
        <h3>Brakuje czegoś?</h3>
        <p>Zgłoś narzędzie, które sprawdziło się na Twoich wydarzeniach – albo takie, które sam tworzysz.</p>
        <span className="st-more">Zgłoś narzędzie →</span>
      </Link>
    </div>
  );
}

function CatalogCard({ entry: e }: { entry: CatalogEntry }) {
  const ours = e.tool ? toolBySlug(e.tool) : null;
  const body = (
    <>
      <p className="st-entry-kind">
        {ours ? <span className="st-badge ours">Animatornia</span> : <span className="st-badge">Polecane</span>}
        {ours?.soon && <span className="st-badge soon">wkrótce</span>}
      </p>
      <h3>{e.name}</h3>
      <p>{e.short}</p>
      <span className="st-more">{ours ? "Zobacz więcej →" : "Przejdź do strony ↗"}</span>
    </>
  );
  if (ours) {
    return (
      <Link href={`/${ours.slug}`} className="st-entry" style={{ "--st-accent": ours.accent } as React.CSSProperties}>
        {body}
      </Link>
    );
  }
  return <a href={e.url} className="st-entry" target="_blank" rel="noopener noreferrer">{body}</a>;
}

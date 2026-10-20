import Link from "next/link";
import { CATALOG, toolBySlug, type CatalogEntry } from "@/lib/site";

/** Katalog narzędzi: nasze pierwsze, potem polecane, na końcu zaproszenie do zgłoszenia własnego. */
export function Catalog() {
  return (
    <div className="st-entries">
      {CATALOG.map((e) => <CatalogCard key={e.name} entry={e} />)}
      <Link href="/wspolpraca#zglos" className="st-entry st-entry-add">
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
        {ours || e.own ? <span className="st-badge ours">Nasze</span> : <span className="st-badge">Polecane</span>}
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
  return (
    <a href={e.url} className={`st-entry${e.own ? " own" : ""}`} target="_blank" rel="noopener noreferrer">{body}</a>
  );
}

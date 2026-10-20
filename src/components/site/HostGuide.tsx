import Link from "next/link";
import { HOST_GUIDE, HOST_GUIDE_KEY_POINTS } from "@/lib/hostGuide";
import { toolBySlug } from "@/lib/site";

/** Instrukcja dla prowadzącego Familiadę – treść z `src/lib/hostGuide.ts`. */
export function HostGuide() {
  const tool = toolBySlug("familiada");
  return (
    <main style={{ "--st-accent": tool.accent } as React.CSSProperties}>
      <section className="st-section">
        <div className="st-wrap">
          <p className="st-eyebrow"><Link href="/familiada">{tool.name}</Link></p>
          <h1>Instrukcja dla prowadzącego</h1>
          <p className="st-sub">Tablica na rzutniku, pilot w Twoim telefonie. Gra idzie jak w telewizji: 5 rund, podsumowanie i finał.</p>
          <div className="st-grid two">
            {HOST_GUIDE_KEY_POINTS.map((s) => (
              <article key={s.title} className="st-card st-callout">
                <h2>{s.title}</h2>
                <ul>{s.steps.map((t) => <li key={t}>{t}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="st-section alt">
        <div className="st-wrap st-guide">
          {HOST_GUIDE.map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <ol>{s.steps.map((t) => <li key={t}>{t}</li>)}</ol>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

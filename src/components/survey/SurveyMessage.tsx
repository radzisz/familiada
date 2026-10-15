import Image from "next/image";
import { Credits } from "@/components/Credits";
import { DEFAULT_BRANDING, type Branding } from "@/lib/branding";
import "./survey.css";

interface ShellProps {
  branding: Branding;
  /** Stopka z nazwą wydarzenia i logami – na pierwszej i ostatniej stronie ankiety, nie przy pytaniach. */
  footer: boolean;
  children: React.ReactNode;
}

export function SurveyShell({ branding, footer, children }: ShellProps) {
  return (
    <main className="sv">
      {/* Nagłówek i stopka stoją w miejscu – przewija się tylko środek (pytanie / treść). */}
      <div className="sv-card">
        <p className="sv-brand">{branding.title}</p>
        <div className="sv-body">{children}</div>
        {footer && <SurveyFooter branding={branding} />}
        <div className="sv-credits"><Credits /></div>
      </div>
    </main>
  );
}

function SurveyFooter({ branding }: { branding: Branding }) {
  return (
    <footer className="sv-footer">
      {branding.eventName && <p className="sv-footer-title">{branding.eventName}</p>}
      <ul className="sv-partners">
        {branding.partners.map((p) => (
          <li key={p.name}>
            <PartnerLink href={p.href}>
              <Image src={p.src} alt={`Logo: ${p.name}`} width={72} height={72} unoptimized={p.fill} />
              <span>{p.name}</span>
            </PartnerLink>
          </li>
        ))}
      </ul>
    </footer>
  );
}

function PartnerLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <span className="sv-partner">{children}</span>;
  return <a className="sv-partner" href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function SurveyMessage({ title, text, branding = DEFAULT_BRANDING }: { title: string; text: string; branding?: Branding }) {
  return (
    <SurveyShell branding={branding} footer>
      <h1 className="sv-title">{title}</h1>
      <p className="sv-text">{text}</p>
    </SurveyShell>
  );
}

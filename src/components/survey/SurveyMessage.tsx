import "./survey.css";

export function SurveyShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="sv">
      <div className="sv-card">
        <p className="sv-brand">Familiada małżeńska</p>
        {children}
      </div>
    </main>
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

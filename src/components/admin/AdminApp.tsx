"use client";

import { Credits } from "@/components/Credits";
import { useEffect, useState } from "react";
import { AdminHeader } from "./AdminHeader";
import { AnswersTab } from "./AnswersTab";
import { GameTab } from "./GameTab";
import { SurveyToggle } from "./LiveBar";
import { QuestionList } from "./QuestionList";
import { SettingsTab } from "./SettingsTab";
import { ShareDialog, SURVEY_CLOSED_WARNING } from "./ShareDialog";
import { useOverview } from "./useOverview";
import type { Overview } from "./types";
import "./admin.css";

type Tab = "questions" | "answers" | "game" | "settings";
const TABS: { id: Tab; label: string }[] = [
  { id: "questions", label: "Pytania" },
  { id: "answers", label: "Odpowiedzi" },
  { id: "game", label: "Przygotowanie do gry" },
  { id: "settings", label: "Ustawienia" },
];

/** Aktywna zakładka zapamiętana w adresie (#answers, #game), żeby odświeżenie strony jej nie gubiło. */
function useTab(): [Tab, (t: Tab) => void] {
  const [tab, setTab] = useState<Tab>("questions");
  useEffect(() => {
    const fromHash = TABS.find((t) => `#${t.id}` === window.location.hash);
    if (fromHash) setTab(fromHash.id);
  }, []);
  const select = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "questions" ? window.location.pathname : `#${t}`);
  };
  return [tab, select];
}

/** Panel jednej rozgrywki (`/admin/<id>`): pytania, odpowiedzi z grupowaniem, przygotowanie do gry, ustawienia. */
export function AdminApp({ eventId }: { eventId: string }) {
  const { overview, error, reload } = useOverview(eventId);
  const [tab, setTab] = useTab();
  const [selected, setSelected] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const regrouped = async () => {
    setRevision((r) => r + 1);
    await reload();
  };

  return (
    <main className="ad">
      <AdminHeader title={overview?.event.name ?? "Rozgrywka"} back badges={overview && <EventBadges overview={overview} />}>
        <a href={`/tablica/${eventId}`} target="_blank" rel="noreferrer">Tablica ↗</a>
        <ShareDialog
          label="Pilot" path={`/tablica/${eventId}?pilot=1`} screenPath={`/qr/${eventId}?pilot=1`}
          hint="Dla operatora: zeskanuj telefonem i wpisz PIN panelu. Nie pokazuj tego kodu widowni."
        />
        <ShareDialog
          label="Ankieta" path={`/ankieta/${eventId}`} screenPath={`/qr/${eventId}`}
          warning={overview && !overview.event.surveyOpen ? SURVEY_CLOSED_WARNING : null}
          hint="Dla uczestników: zeskanuj kod albo wyślij link. „Kod na cały ekran” pokażesz na rzutniku."
        />
      </AdminHeader>
      {error && <p className="ad-error" role="alert">{error}</p>}
      {!overview && !error && <p>Wczytywanie…</p>}
      {overview && (
        <>
          <div className="ad-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {/* Nagłówek i zakładki stoją w miejscu – przewija się tylko zawartość zakładki. */}
          <div className="ad-scroll">
          {tab === "questions" && (
            <QuestionList overview={overview} onChange={reload} />
          )}
          {tab === "answers" && (
            <AnswersTab
              overview={overview} selected={selected} revision={revision}
              surveyToggle={<SurveyToggle overview={overview} onChange={reload} />}
              onSelect={setSelected} onChange={reload} onRegrouped={regrouped}
            />
          )}
          {tab === "game" && <GameTab overview={overview} onChange={reload} />}
          {tab === "settings" && <SettingsTab overview={overview} onChange={reload} />}
          </div>
        </>
      )}
      <footer className="ad-credits"><Credits /></footer>
    </main>
  );
}

/** Plakietki przy nazwie rozgrywki: stan ankiety i tryb testowy (zmiana w „Pytaniach” i „Ustawieniach”). */
function EventBadges({ overview }: { overview: Overview }) {
  const open = overview.event.surveyOpen;
  return (
    <>
      <span className={open ? "ad-badge ok" : "ad-badge off"}>{open ? "ankieta otwarta" : "ankieta zamknięta"}</span>
      {overview.event.isTest && <span className="ad-badge test">tryb testowy</span>}
    </>
  );
}

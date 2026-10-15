"use client";

import { isShown, MAX_STRIKES, multiplier, nextStep, potValue, type GameAction, type GameState, type NextStep, type Team } from "@/lib/game";
import type { Board, BoardAnswer, BoardQuestion } from "@/lib/types";
import { LedCounter } from "./LedCounter";
import { useCountdown } from "./useCountdown";
import type { Sound } from "./sound";
import type { BoardFx, ScoreGain } from "./useBoardEffects";

interface Props {
  state: GameState;
  board: Board;
  fx: BoardFx;
  sound: Sound;
  hideHost: boolean;
  /** Ekran operatora (?pilot=1): panel pokazuje pytanie i wszystkie odpowiedzi, których widownia nie widzi. */
  pilot: boolean;
  dispatch: (a: GameAction) => void;
  /** Następna runda albo finał; wczytuje też od nowa pytania. */
  onNext: () => void;
  onTogglePanel: () => void;
}

/** Litery odkrytej odpowiedzi zapalają się po kolei co tyle ms, jak żarówki na tablicy. */
const LETTER_MS = 45;

export function GameView({ state, board, fx, sound, hideHost, pilot, dispatch, onNext, onTogglePanel }: Props) {
  const question = board.rounds[state.round - 1] ?? null;
  const answers = question?.answers ?? [];
  const m = multiplier(state.round);
  // Po pokazaniu pytania nad polem odpowiedzi odliczamy kilka sekund, na końcu „piii”.
  const countdown = useCountdown(state.questionEndsAt, sound.whistle);
  // Przy panelu prowadzącego pola drużyn służą do wyboru, kto odpowiada; na samym podglądzie są tylko wynikiem.
  const selectTeam = hideHost ? null : (team: Team) => dispatch({ type: "setTurn", team });
  return (
    <section>
      <div className="tb-scores">
        <TeamScore team="w" name="ŻONY" active={state.turn === "w"} score={state.scoreW} gain={fx.gain} onStep={sound.tick} onSelect={selectTeam} />
        <div className="tb-pot">
          <div className="lbl">Pula ×{m}{state.turn ? ` · ${TEAM_NAME[state.turn]}` : ""}</div>
          {/* Po przyznaniu pula „przechodzi” do drużyny – licznik schodzi do zera. */}
          <LedCounter className="val" value={state.awarded.includes(state.round) ? 0 : potValue(state, answers) * m} onStep={sound.tick} />
        </div>
        <TeamScore team="h" name="MĘŻOWIE" active={state.turn === "h"} score={state.scoreH} gain={fx.gain} onStep={sound.tick} onSelect={selectTeam} />
      </div>
      <div className="tb-board">
        <StrikeColumn team="w" count={state.strikes.w} />
        <div className="tb-center">
        <div className="tb-round">Runda {state.round}{m > 1 ? ` · punkty ×${m}` : ""}</div>
        <p className="tb-qtext">{questionText(question, state.questionShown)}</p>
        <div className="tb-slots">
          {answers.map((a, i) => (
            <Slot
              key={`${state.round}-${i}`} answer={a} index={i} shown={isShown(state, i)}
              flip={fx.flipped === i}
              onClick={() => dispatch({ type: "reveal", index: i, slotCount: answers.length })}
            />
          ))}
          {countdown !== null && countdown > 0 && (
            <div className="tb-countdown" aria-live="polite"><span key={countdown}>{countdown}</span></div>
          )}
        </div>
        </div>
        <StrikeColumn team="h" count={state.strikes.h} />
        {fx.bigX > 0 && <div key={fx.bigX} className="tb-bigx show" aria-hidden="true">X</div>}
      </div>
      {pilot && <AnswerKey question={question} state={state} dispatch={dispatch} />}
      {!hideHost && <GamePanel state={state} answers={answers} pilot={pilot} dispatch={dispatch} onNext={onNext} onTogglePanel={onTogglePanel} />}
    </section>
  );
}

const TEAM_NAME = { w: "ŻONY", h: "MĘŻOWIE" } as const;

/** Kolumna błędów drużyny przy krawędzi tablicy: trzy „lampki X”, zapalone tyle, ile drużyna ma błędów. */
function StrikeColumn({ team, count }: { team: "w" | "h"; count: number }) {
  const name = team === "w" ? "Żony" : "Mężowie";
  return (
    <div className={`tb-xcol ${team}`} role="status" aria-label={`${name}: błędów ${count}`}>
      {Array.from({ length: MAX_STRIKES }, (_, i) => <span key={i} className={i < count ? "on" : ""} aria-hidden="true">X</span>)}
    </div>
  );
}

/** Tekst pytania na tablicy: ukryty, dopóki prowadzący nie kliknie „Dalej” (odsłonięcie pytania to element gry). */
function questionText(question: BoardQuestion | null, shown: boolean): string {
  if (!question) return "Nie wybrano pytania do tej rundy – przypisz je w panelu rozgrywki";
  // Twarda spacja trzyma wysokość wiersza, żeby tablica nie skakała po odsłonięciu pytania.
  return shown ? question.text : " ";
}

const NEXT_HINT: Record<NextStep, string> = { question: "pokaż pytanie", round: "następne pytanie", final: "finał" };

/** Wynik drużyny; drużyna, która teraz odpowiada (ma pulę), jest podświetlona. */
interface TeamScoreProps {
  team: Team;
  name: string;
  active: boolean;
  score: number;
  gain: ScoreGain | null;
  onStep: () => void;
  /** Pilot: kliknięcie pola drużyny wybiera ją jako odpowiadającą (null = pole tylko do podglądu). */
  onSelect: ((team: Team) => void) | null;
}

function TeamScore(p: TeamScoreProps) {
  const gain = p.gain?.team === p.team ? p.gain : null;
  const content = (
    <>
      <span className="name">{p.name}</span>
      <LedCounter className="pts" value={p.score} onStep={p.onStep} />
      {gain && <span key={gain.key} className="tb-flash" aria-hidden="true" />}
      {gain && <span key={`+${gain.key}`} className="tb-gain" aria-hidden="true">+{gain.amount}</span>}
    </>
  );
  const className = `tb-team ${p.team}${p.active ? " active" : ""}`;
  if (!p.onSelect) return <div className={className}>{content}</div>;
  const select = p.onSelect;
  return (
    <button type="button" className={className} aria-pressed={p.active} title={`Odpowiada: ${p.name}`} onClick={() => select(p.team)}>
      {content}
    </button>
  );
}

/** Tekst odpowiedzi, którego litery zapalają się kolejno (opóźnienie rośnie z pozycją litery). */
export function LitText({ text }: { text: string }) {
  return (
    <>
      <span className="tb-sr">{text}</span>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="tb-lit" aria-hidden="true" style={{ animationDelay: `${i * LETTER_MS}ms` }}>{ch}</span>
      ))}
    </>
  );
}

function Slot(p: { answer: BoardAnswer; index: number; shown: boolean; flip: boolean; onClick: () => void }) {
  const label = p.shown ? `${p.index + 1}. ${p.answer.label}, ${p.answer.points} punktów` : `Odkryj odpowiedź ${p.index + 1}`;
  const animate = p.shown && p.flip;
  const pointsDelay = { animationDelay: `${Array.from(p.answer.label).length * LETTER_MS}ms` };
  return (
    <button
      type="button" className={`tb-slot${p.shown ? "" : " hidden"}${animate ? " just" : ""}`}
      aria-label={label} onClick={p.onClick}
    >
      <span>{p.index + 1}.</span>
      <span className="ans">{!p.shown ? "•".repeat(14) : animate ? <LitText text={p.answer.label} /> : p.answer.label}</span>
      <span className={animate ? "p tb-lit" : "p"} style={animate ? pointsDelay : undefined}>{p.shown ? p.answer.points : "--"}</span>
    </button>
  );
}

/**
 * Ściąga operatora: pytanie i pełna lista odpowiedzi z punktami, wyglądająca jak tablica –
 * odpowiedź ukryta na tablicy jest wyszarzona, odkryta jasna. Kliknięcie wiersza pokazuje / chowa ją na tablicy.
 * Tylko na ekranie pilota – na rzutniku zdradziłaby odpowiedzi widowni.
 */
function AnswerKey(p: { question: BoardQuestion | null; state: GameState; dispatch: (a: GameAction) => void }) {
  if (!p.question) return <p className="tb-key-q">Nie wybrano pytania do tej rundy – przypisz je w panelu rozgrywki.</p>;
  const slotCount = p.question.answers.length;
  // Trafiona odpowiedź idzie do puli drużyny – bez wybranej drużyny nie da się jej odkryć.
  const noTeam = p.state.turn === null;
  return (
    <div className="tb-key">
      <p className="tb-key-q">{p.question.text}</p>
      {noTeam && <p className="tb-key-warn">Najpierw wybierz drużynę, która odpowiada – dopiero wtedy odkryjesz odpowiedź albo dasz błąd.</p>}
      <ol>
        {p.question.answers.map((a, i) => {
          const shown = isShown(p.state, i);
          return (
            <li key={i}>
              <button
                type="button" className={shown ? "shown" : "concealed"} aria-pressed={shown} disabled={!shown && noTeam}
                aria-label={`${a.label}, ${a.points} pkt – ${shown ? "widoczna na tablicy, kliknij, aby ukryć" : "ukryta, kliknij, aby pokazać"}`}
                onClick={() => p.dispatch(shown ? { type: "conceal", index: i } : { type: "reveal", index: i, slotCount })}
              >
                <span>{i + 1}.</span><span className="a">{a.label}</span><span className="p">{a.points}</span>
                <span className="s">{shown ? <EyeIcon /> : <EyeOffIcon />}</span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button" className="tb-key-strike" disabled={noTeam || p.state.strikes[p.state.turn ?? "w"] >= MAX_STRIKES}
            onClick={() => p.dispatch({ type: "strike" })}
          >
            <span>✗</span><span className="a">Błąd</span>
            <span className="p">{p.state.turn ? `${p.state.strikes[p.state.turn]}/${MAX_STRIKES}` : ""}</span><span className="s" />
          </button>
        </li>
      </ol>
    </div>
  );
}

const ICON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function EyeIcon() {
  return (
    <svg {...ICON}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...ICON}>
      <path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

interface PanelProps {
  state: GameState;
  answers: BoardAnswer[];
  pilot: boolean;
  dispatch: (a: GameAction) => void;
  onNext: () => void;
  onTogglePanel: () => void;
}

function GamePanel({ state, answers, pilot, dispatch, onNext, onTogglePanel }: PanelProps) {
  const awarded = state.awarded.includes(state.round);
  // Bez wybranej drużyny nie wiadomo, komu dać pulę – wtedy kończenie rundy jest zablokowane.
  const needTurn = !awarded && state.turn === null;
  return (
    <div className="tb-panel">
      <div className="tb-sections">
        <section className="tb-sec" aria-label="Nawigacja">
          <h3>Nawigacja</h3>
          {/* Jedna linia: na pilocie błąd jest ostatnią pozycją listy odpowiedzi, na tablicy zostaje tu. */}
          <div className="tb-row tb-nav-row">
            <UndoButton state={state} dispatch={dispatch} />
            {!pilot && <StrikeButton state={state} dispatch={dispatch} />}
            <button type="button" title="Odsłania od dołu kolejną nieodkrytą odpowiedź – bez punktów" onClick={() => dispatch({ type: "uncoverNext", slotCount: answers.length })}>Pokaż</button>
            <NextButton state={state} highlight={awarded} disabled={needTurn && potValue(state, answers) > 0} onNext={onNext} />
            {!pilot && <button type="button" onClick={onTogglePanel}>Ukryj panel</button>}
          </div>
          <NextHint text={nextHintText(state)} />
        </section>
      </div>
      <p className="tb-hint">
        {awarded ? "Pula tej rundy przyznana." : needTurn ? "Kliknij pole ŻONY albo MĘŻOWIE u góry – ta drużyna odpowiada i do niej trafi pula." : "Pula trafi do zaznaczonej drużyny przy „Dalej”. „Pokaż” odsłania od dołu nieodkryte odpowiedzi, bez punktów."}
      </p>
      {!pilot && (
        <p className="tb-hint">
          Skróty: <kbd>1</kbd>–<kbd>6</kbd> odkrywa odpowiedź, <kbd>X</kbd> błąd, <kbd>Backspace</kbd> wstecz,
          {" "}<kbd>H</kbd> ukryj lub pokaż panel. Odpowiedź możesz też kliknąć na tablicy.
        </p>
      )}
    </div>
  );
}

/** „X (błąd)” dla drużyny, która odpowiada; bez wybranej drużyny nieaktywny. */
function StrikeButton({ state, dispatch }: { state: GameState; dispatch: (a: GameAction) => void }) {
  return (
    <button
      type="button" className="soft bad" disabled={state.turn === null}
      title={state.turn === null ? "Najpierw wybierz drużynę, która odpowiada" : "Błąd drużyny, która odpowiada"}
      onClick={() => dispatch({ type: "strike" })}
    >X (błąd)</button>
  );
}

/** „Wstecz” cofa ostatnią akcję (błąd, odkrycie, pulę, „Dalej”) – nie przechodzi do poprzedniego pytania. */
export function UndoButton({ state, dispatch }: { state: GameState; dispatch: (a: GameAction) => void }) {
  return (
    <button
      type="button" disabled={state.history.length === 0} title="Cofa ostatnią akcję, np. błędnie dany X"
      onClick={() => dispatch({ type: "undo" })}
    >
      ↶ Wstecz
    </button>
  );
}

/** „Dalej →” z dopiskiem pod spodem, co się stanie: pokaż pytanie / następne pytanie / finał. */
/** Co zrobi „Dalej” w rundach (null = nic). */
function nextHintText(state: GameState): string | null {
  const step = nextStep(state);
  return step === null ? null : NEXT_HINT[step];
}

/** Opis „Dalej” pod przyciskami (a nie w przycisku – ten zostaje mały). */
export function NextHint({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className="tb-next-hint">Dalej: <b>{text}</b></p>;
}

function NextButton(p: { state: GameState; highlight: boolean; disabled: boolean; onNext: () => void }) {
  const step = nextStep(p.state);
  if (step === null) return null;
  return (
    <button type="button" className={`tb-next${p.highlight || step === "question" ? " primary" : ""}`} disabled={p.disabled} onClick={p.onNext}>
      Dalej →
    </button>
  );
}

"use client";

import { NONE, WRONG, type GameAction, type GameState, type Person } from "@/lib/game";
import type { BoardQuestion } from "@/lib/types";

const PERSON_NAME: Record<Person, string> = { p1: "Osoba 1", p2: "Osoba 2" };

interface Props {
  state: GameState;
  questions: (BoardQuestion | null)[];
  /** Czyje odpowiedzi teraz zaznaczamy (wynika z kroku finału – „Dalej” przełącza na osobę 2). */
  person: Person;
  dispatch: (a: GameAction) => void;
}

/** Finał na pilocie: pytania jako kafelki z odpowiedziami do kliknięcia i „Błędna” – dla wybranej osoby. */
export function FinalPicker({ state, questions, person, dispatch }: Props) {
  return (
    <div className="tb-fpick">
      <p className="tb-fpick-who">Odpowiada: <b>{PERSON_NAME[person]}</b></p>
      {questions.map((q, k) => <PickBox key={k} index={k} question={q} person={person} state={state} dispatch={dispatch} />)}
    </div>
  );
}

interface BoxProps {
  index: number;
  question: BoardQuestion | null;
  person: Person;
  state: GameState;
  dispatch: (a: GameAction) => void;
}

/** Jedno pytanie finału: odpowiedzi z punktami + „Błędna”; ponowne kliknięcie wybranej odznacza ją. */
function PickBox({ index, question, person, state, dispatch }: BoxProps) {
  if (!question) return <div className="tb-fbox"><p className="tb-fbox-q">{index + 1}. (nie wybrano pytania)</p></div>;
  const picked = state.final[person][index] ?? NONE;
  const blocked = person === "p2" ? (state.final.p1[index] ?? NONE) : NONE;
  const pick = (answer: number) =>
    dispatch({ type: "finalPick", person, question: index, answer: picked === answer ? NONE : answer });
  return (
    <div className={`tb-fbox${picked === NONE ? "" : " done"}`}>
      <p className="tb-fbox-q"><b>{index + 1}.</b> {question.text}</p>
      <div className="tb-fbox-answers">
        {question.answers.map((a, i) => (
          <button
            key={i} type="button" className={picked === i ? "on" : ""} aria-pressed={picked === i} disabled={i === blocked}
            title={i === blocked ? "Osoba 1 już podała tę odpowiedź" : undefined} onClick={() => pick(i)}
          >
            <span className="a">{a.label}</span>
            <span className="p">{i === blocked ? "os. 1" : a.points}</span>
          </button>
        ))}
        <button type="button" className={`wrong${picked === WRONG ? " on" : ""}`} aria-pressed={picked === WRONG} onClick={() => pick(WRONG)}>
          ✗ Błędna
        </button>
      </div>
    </div>
  );
}

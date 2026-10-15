"use client";

import { MAX_ANSWER_LENGTH } from "@/lib/types";

interface Props {
  index: number;
  total: number;
  text: string;
  value: string;
  onChange: (text: string) => void;
  onGo: (index: number) => void;
}

/** Jedno pytanie na ekranie z paskiem postępu. */
export function QuestionStep({ index, total, text, value, onChange, onGo }: Props) {
  const isLast = index === total - 1;
  const hasText = value.trim() !== "";
  const nextLabel = isLast ? "Wyślij" : hasText ? "Dalej" : "Pomiń";
  const inputId = `answer-${index}`;
  return (
    <form
      className="sv-q"
      onSubmit={(e) => {
        e.preventDefault();
        onGo(index + 1);
      }}
    >
      <div className="sv-progress" aria-hidden="true">
        <div className="sv-progress-bar" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <p className="sv-step">Pytanie {index + 1} z {total}</p>
      <label htmlFor={inputId} className="sv-question">{text}</label>
      <input
        id={inputId}
        className="sv-input"
        value={value}
        maxLength={MAX_ANSWER_LENGTH}
        onChange={(e) => onChange(e.target.value)}
        placeholder="jedno lub dwa słowa"
        autoComplete="off"
        autoCapitalize="sentences"
        enterKeyHint={isLast ? "send" : "next"}
        autoFocus
      />
      <p className="sv-hint">Pytanie możesz pominąć. {value.length}/{MAX_ANSWER_LENGTH}</p>
      <div className="sv-actions">
        <button type="button" className="sv-btn ghost" onClick={() => onGo(index - 1)}>Wstecz</button>
        <button type="submit" className={`sv-btn ${hasText || isLast ? "primary" : "ghost"}`}>{nextLabel}</button>
      </div>
    </form>
  );
}

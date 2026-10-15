"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, postJson } from "@/lib/client/api";
import { eventUrl } from "@/lib/client/eventUrl";
import { BoardPreview } from "./BoardPreview";
import { EmptyQuestion } from "./EmptyQuestion";
import { GroupCard, type GroupOp } from "./GroupCard";
import type { DetailResponse } from "./types";

interface Props {
  eventId: string;
  questionId: string;
  /** Puste pytania rozgrywki testowej; null = rozgrywka prawdziwa. */
  emptyQuestionIds: string[] | null;
  onChange: () => Promise<void>;
}

/** Ładuje szczegóły pytania; przy pierwszym otwarciu grupuje automatycznie po `normalized`. */
function useQuestionDetail(eventId: string, questionId: string, onChange: () => Promise<void>) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const autoDone = useRef(false);

  const load = useCallback(async () => {
    const res = await apiJson<DetailResponse>(eventUrl(`/api/admin/questions/${questionId}`, eventId));
    if (!res.ok) return setMessage(res.error);
    setDetail(res.data);
    if (res.data.ungrouped > 0 && !autoDone.current) {
      autoDone.current = true;
      const g = await postJson(eventUrl(`/api/admin/questions/${questionId}/group`, eventId), { mode: "basic" });
      if (!g.ok) return setMessage(g.error);
      await load();
      await onChange();
    }
  }, [eventId, questionId, onChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(async (url: string, body: unknown, okMessage: string) => {
    setBusy(true);
    const res = await postJson(eventUrl(url, eventId), body);
    setBusy(false);
    setMessage(res.ok ? okMessage : res.error);
    await load();
    await onChange();
  }, [eventId, load, onChange]);

  const reload = useCallback(async () => {
    await load();
    await onChange();
  }, [load, onChange]);

  return { detail, message, busy, run, reload };
}

/** Odpowiedzi jednego pytania: podgląd tablicy i grupy do ręcznej poprawki (AI – zbiorczo w „Zarządzaniu”). */
export function GroupingPanel({ eventId, questionId, emptyQuestionIds, onChange }: Props) {
  const { detail, message, busy, run, reload } = useQuestionDetail(eventId, questionId, onChange);
  const base = `/api/admin/questions/${questionId}`;
  const op = (body: GroupOp) => run(`${base}/groups`, body, "");

  if (!detail) return <p className="ad-muted">{message || "Wczytywanie…"}</p>;
  const named = detail.groups.filter((g): g is typeof g & { id: string } => g.id !== null);

  return (
    <div className="ad-grouping">
      <h2>{detail.question.text}</h2>
      <p className="ad-muted">Odpowiedzi: {detail.respondents} · grup: {detail.groups.length}</p>
      {detail.respondents === 0 && (
        <EmptyQuestion eventId={eventId} questionId={questionId} emptyQuestionIds={emptyQuestionIds} onGenerated={reload} />
      )}
      <div className="ad-row">
        {detail.ungrouped > 0 && (
          <button type="button" disabled={busy} onClick={() => void run(`${base}/group`, { mode: "basic" }, "Dopisano nowe odpowiedzi.")}>
            Dopisz nowe odpowiedzi ({detail.ungrouped})
          </button>
        )}
        {message && <span className="ad-msg" aria-live="polite">{message}</span>}
      </div>
      <BoardPreview answers={detail.board} />
      {named.length > 0 && (
        <p className="ad-muted">
          Przeciągnij odpowiedź na inną grupę albo użyj listy „przenieś do”. Kliknij etykietę, aby ją zmienić.
        </p>
      )}
      <div className="ad-groups">
        {named.map((g) => (
          <GroupCard key={g.id} group={g} groups={named} busy={busy} onOp={op} />
        ))}
      </div>
    </div>
  );
}

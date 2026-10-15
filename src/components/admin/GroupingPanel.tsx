"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, postJson } from "@/lib/client/api";
import { useTwoStep } from "@/lib/client/useTwoStep";
import { BoardPreview } from "./BoardPreview";
import { GroupCard, type GroupOp } from "./GroupCard";
import type { DetailResponse } from "./types";

interface Props {
  questionId: string;
  onChange: () => Promise<void>;
}

/** Ładuje szczegóły pytania; przy pierwszym otwarciu grupuje automatycznie po `normalized`. */
function useQuestionDetail(questionId: string, onChange: () => Promise<void>) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const autoDone = useRef(false);

  const load = useCallback(async () => {
    const res = await apiJson<DetailResponse>(`/api/admin/questions/${questionId}`);
    if (!res.ok) return setMessage(res.error);
    setDetail(res.data);
    if (res.data.ungrouped > 0 && !autoDone.current) {
      autoDone.current = true;
      const g = await postJson(`/api/admin/questions/${questionId}/group`, { mode: "basic" });
      if (!g.ok) return setMessage(g.error);
      await load();
      await onChange();
    }
  }, [questionId, onChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(async (url: string, body: unknown, okMessage: string) => {
    setBusy(true);
    const res = await postJson(url, body);
    setBusy(false);
    setMessage(res.ok ? okMessage : res.error);
    await load();
    await onChange();
  }, [load, onChange]);

  return { detail, message, busy, run };
}

export function GroupingPanel({ questionId, onChange }: Props) {
  const { detail, message, busy, run } = useQuestionDetail(questionId, onChange);
  const base = `/api/admin/questions/${questionId}`;
  const ai = useTwoStep(() => void run(`${base}/group`, { mode: "ai" }, "Pogrupowano z AI."));
  const op = (body: GroupOp) => run(`${base}/groups`, body, "");

  if (!detail) return <p className="ad-muted">{message || "Wczytywanie…"}</p>;
  const named = detail.groups.filter((g): g is typeof g & { id: string } => g.id !== null);

  return (
    <div className="ad-grouping">
      <h2>{detail.question.text}</h2>
      <p className="ad-muted">Odpowiedzi: {detail.respondents} · grup: {detail.groups.length}</p>
      <div className="ad-row">
        <button type="button" className="primary" disabled={busy || detail.respondents === 0} onClick={ai.click}>
          {busy ? "Pracuję…" : ai.armed ? "Kliknij ponownie – zastąpi ręczne zmiany" : "Pogrupuj z AI"}
        </button>
        {detail.ungrouped > 0 && (
          <button type="button" disabled={busy} onClick={() => void run(`${base}/group`, { mode: "basic" }, "Dopisano nowe odpowiedzi.")}>
            Dopisz nowe odpowiedzi ({detail.ungrouped})
          </button>
        )}
        {message && <span className="ad-msg" aria-live="polite">{message}</span>}
      </div>
      <BoardPreview answers={detail.board} />
      <p className="ad-muted">
        Przeciągnij odpowiedź na inną grupę albo użyj listy „przenieś do”. Kliknij etykietę, aby ją zmienić.
      </p>
      <div className="ad-groups">
        {named.map((g) => (
          <GroupCard key={g.id} group={g} groups={named} busy={busy} onOp={op} />
        ))}
      </div>
    </div>
  );
}

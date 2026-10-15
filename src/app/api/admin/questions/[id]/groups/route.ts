import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { GroupOpSchema } from "@/lib/schemas";
import { jsonError, parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { mergeGroups, moveAnswer, updateGroup } from "@/lib/server/repo/groups";
import { fetchQuestion } from "@/lib/server/repo/questions";

type Params = { params: Promise<{ id: string }> };
type GroupOp = z.infer<typeof GroupOpSchema>;

/** Wykonuje jedną ręczną poprawkę grupowania (zapis do bazy). */
async function applyGroupOp(db: SupabaseClient, questionId: string, op: GroupOp): Promise<void> {
  switch (op.op) {
    case "move": return moveAnswer(db, questionId, op.normalized, { groupId: op.groupId });
    case "moveNew": return moveAnswer(db, questionId, op.normalized, { newLabel: op.label });
    case "merge": return mergeGroups(db, questionId, op.from, op.into);
    case "rename": return updateGroup(db, questionId, op.groupId, { label: op.label });
    case "hide": return updateGroup(db, questionId, op.groupId, { hidden: op.hidden });
  }
}

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const body = await parseBody(req, GroupOpSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "question.groups", async ({ db, event }) => {
    const question = await fetchQuestion(db, event.id, id);
    if (!question) return jsonError("Nie ma takiego pytania.", 404);
    await applyGroupOp(db, question.id, body);
    return NextResponse.json({ ok: true });
  });
}

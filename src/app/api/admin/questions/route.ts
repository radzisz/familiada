import { NextResponse } from "next/server";
import { NewQuestionSchema, ReorderSchema } from "@/lib/schemas";
import { parseBody } from "@/lib/server/http";
import { adminRoute } from "@/lib/server/route";
import { insertQuestion, updateQuestionOrder } from "@/lib/server/repo/questions";

/** Dodaj pytanie na końcu listy. */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, NewQuestionSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "questions.add", async ({ db, event }) => {
    await insertQuestion(db, event.id, body);
    return NextResponse.json({ ok: true });
  });
}

/** Zmień kolejność pytań. */
export async function PUT(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, ReorderSchema);
  if (body instanceof NextResponse) return body;
  return adminRoute(req, "questions.reorder", async ({ db, event }) => {
    await updateQuestionOrder(db, event.id, body.ids);
    return NextResponse.json({ ok: true });
  });
}

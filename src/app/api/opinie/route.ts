import { NextResponse } from "next/server";
import { OpinionSubmitSchema, prepareOpinion } from "@/lib/opinions";
import { check, serviceClient } from "@/lib/server/db";
import { jsonError, parseBody, serverError } from "@/lib/server/http";

/** Publiczny zapis opinii o rekolekcjach (anonimowo, jeden wiersz na wysłany formularz). */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, OpinionSubmitSchema);
  if (body instanceof NextResponse) return body;
  const answers = prepareOpinion(body.answers);
  if (answers.length === 0) return jsonError("Odpowiedz przynajmniej na jedno pytanie.", 400);
  try {
    const { error } = await serviceClient().from("opinions").insert({ retreat: body.retreat || null, answers });
    check("opinions.insert", error);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("opinie", err);
  }
}

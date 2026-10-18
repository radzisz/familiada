import { NextResponse } from "next/server";
import { contactError, OPINION_SURVEY, OpinionContactSchema } from "@/lib/opinions";
import { check, serviceClient } from "@/lib/server/db";
import { jsonError, parseBody, serverError } from "@/lib/server/http";

/**
 * Opcjonalny kontakt po wysłaniu ankiety – osobne zgłoszenie do `opinion_contacts`, bez powiązania
 * z odpowiedziami (ankieta zostaje anonimowa). Treść zgody zapisywana przy wierszu.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, OpinionContactSchema);
  if (body instanceof NextResponse) return body;
  const invalid = contactError(body);
  if (invalid) return jsonError(invalid, 400);
  try {
    const { error } = await serviceClient().from("opinion_contacts").insert({
      retreat: body.retreat || null,
      name: body.name.trim() || null,
      email: body.email.trim(),
      consent_text: OPINION_SURVEY.contact.consent,
    });
    check("opinion_contacts.insert", error);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("opinie.kontakt", err);
  }
}

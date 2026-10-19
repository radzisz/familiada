import { NextResponse } from "next/server";
import { CONTACT_CONSENT, ContactRequestSchema, contactRequestError, isBot } from "@/lib/contact";
import { check, serviceClient } from "@/lib/server/db";
import { jsonError, parseBody, serverError } from "@/lib/server/http";

/** Zapytanie z formularza „Napisz do nas” na stronie Animatorni → `contact_requests`. */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseBody(req, ContactRequestSchema);
  if (body instanceof NextResponse) return body;
  // Bot dostaje „sukces”, żeby nie uczył się omijać pułapki.
  if (isBot(body)) return NextResponse.json({ ok: true });
  const invalid = contactRequestError(body);
  if (invalid) return jsonError(invalid, 400);
  const orNull = (s: string) => s.trim() || null;
  try {
    const { error } = await serviceClient().from("contact_requests").insert({
      topic: body.topic,
      name: orNull(body.name),
      email: body.email.trim(),
      organization: orNull(body.organization),
      message: orNull(body.message),
      source: orNull(body.source),
      consent_text: CONTACT_CONSENT,
    });
    check("contact_requests.insert", error);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("kontakt", err);
  }
}

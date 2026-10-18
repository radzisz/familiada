import { OpinionForm } from "@/components/opinions/OpinionForm";
import { DEFAULT_BRANDING, type Branding } from "@/lib/branding";
import { OPINION_SURVEY, RETREAT_MAX } from "@/lib/opinions";
import { serviceClient } from "@/lib/server/db";
import { brandingOf, fetchLatestEvent } from "@/lib/server/repo/events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opinia o rekolekcjach" };

/** Oprawa z najnowszej rozgrywki Familiady (nazwa wydarzenia, loga); bez niej – domyślna. */
async function loadBranding(): Promise<Branding> {
  try {
    const event = await fetchLatestEvent(serviceClient());
    if (!event) return DEFAULT_BRANDING;
    const branding = brandingOf(event);
    // W nagłówku nazwa wydarzenia zamiast tytułu tablicy („Familiada…”) – to ankieta o całych rekolekcjach.
    return { ...branding, title: branding.eventName ?? branding.title };
  } catch (err) {
    console.error("[opinie page] branding", err);
    return DEFAULT_BRANDING;
  }
}

/** Formularz opinii – link `/opinie` (domyślne rekolekcje) albo `/opinie?r=<nazwa rekolekcji>`. */
export default async function OpinionPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const retreat = typeof r === "string" && r.trim() ? r.trim().slice(0, RETREAT_MAX) : OPINION_SURVEY.retreat;
  return <OpinionForm retreat={retreat} branding={await loadBranding()} />;
}

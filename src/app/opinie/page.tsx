import { OpinionForm } from "@/components/opinions/OpinionForm";
import { OPINION_SURVEY, RETREAT_MAX } from "@/lib/opinions";

export const metadata = { title: "Opinia o rekolekcjach" };

/** Formularz opinii – link `/opinie` (domyślne rekolekcje) albo `/opinie?r=<nazwa rekolekcji>`. */
export default async function OpinionPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const retreat = typeof r === "string" && r.trim() ? r.trim().slice(0, RETREAT_MAX) : OPINION_SURVEY.retreat;
  return <OpinionForm retreat={retreat} />;
}

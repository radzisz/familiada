import type { Metadata } from "next";
import { PLATFORM, toolBySlug, type ToolSlug } from "./site";

const OPEN_GRAPH = { siteName: PLATFORM.name, locale: "pl_PL", type: "website" } as const;

/** Wspólne dla strony Animatorni: adres bazowy linków kanonicznych i podglądu w komunikatorach. */
export const SITE_METADATA: Metadata = { metadataBase: new URL(`https://${PLATFORM.domain}`), openGraph: OPEN_GRAPH };

/** Tytuł, opis i podgląd linku jednej strony (openGraph strony zastępuje cały openGraph layoutu). */
export function pageMetadata(path: string, title: string, description: string): Metadata {
  return { title, description, alternates: { canonical: path }, openGraph: { ...OPEN_GRAPH, title, description, url: path } };
}

export function toolMetadata(slug: ToolSlug): Metadata {
  const tool = toolBySlug(slug);
  return pageMetadata(`/${slug}`, `${tool.name} – ${PLATFORM.name}`, tool.short);
}

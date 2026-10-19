import type { Metadata } from "next";
import { PLATFORM, toolBySlug, type ToolSlug } from "./site";

export function toolMetadata(slug: ToolSlug): Metadata {
  const tool = toolBySlug(slug);
  return { title: `${tool.name} – ${PLATFORM.name}`, description: tool.short };
}

import type { Metadata } from "next";
import { ToolPage } from "@/components/site/ToolPage";
import { toolMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = toolMetadata("familiada");

export default function Page() {
  return <ToolPage slug="familiada" />;
}

import type { Metadata } from "next";
import { ToolPage } from "@/components/site/ToolPage";
import { toolMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = toolMetadata("spiewnik");

export default function Page() {
  return <ToolPage slug="spiewnik" />;
}

import type { Metadata } from "next";
import { HostGuide } from "@/components/site/HostGuide";

export const metadata: Metadata = {
  title: "Familiada – instrukcja dla prowadzącego",
  description: "Jak poprowadzić Familiadę: tablica na rzutniku, pilot w telefonie, rundy, podsumowanie i finał.",
};

export default function Page() {
  return <HostGuide />;
}

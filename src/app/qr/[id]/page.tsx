import { notFound } from "next/navigation";
import { PinForm } from "@/components/PinForm";
import { QrScreen } from "@/components/QrScreen";
import { isAdmin } from "@/lib/server/auth";
import { fetchEventForPage } from "@/lib/server/pageEvent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kod QR – Familiada" };

interface Props {
  params: Promise<{ id: string }>;
  /** `?pilot=1` – kod do pilota prowadzącego zamiast do ankiety. */
  searchParams: Promise<{ pilot?: string }>;
}

export default async function QrPage({ params, searchParams }: Props) {
  if (!(await isAdmin())) return <PinForm title="Kod QR" />;
  const [{ id }, { pilot }] = await Promise.all([params, searchParams]);
  const event = await fetchEventForPage(id);
  if (!event) notFound();
  const target = pilot === "1" ? "pilot" : "survey";
  return <QrScreen baseUrl={process.env.NEXT_PUBLIC_BASE_URL || null} eventId={event.id} target={target} />;
}

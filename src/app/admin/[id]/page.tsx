import { notFound } from "next/navigation";
import { AdminApp } from "@/components/admin/AdminApp";
import { PinForm } from "@/components/PinForm";
import { isAdmin } from "@/lib/server/auth";
import { fetchEventForPage } from "@/lib/server/pageEvent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel prowadzącego – Familiada" };

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return <PinForm title="Panel prowadzącego" />;
  const event = await fetchEventForPage((await params).id);
  if (!event) notFound();
  return <AdminApp eventId={event.id} />;
}

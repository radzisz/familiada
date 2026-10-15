import { notFound } from "next/navigation";
import { BoardApp } from "@/components/board/BoardApp";
import { PinForm } from "@/components/PinForm";
import { isAdmin } from "@/lib/server/auth";
import { fetchEventForPage } from "@/lib/server/pageEvent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tablica – Familiada" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pilot?: string }>;
}

export default async function TablicaPage({ params, searchParams }: Props) {
  if (!(await isAdmin())) return <PinForm title="Tablica Familiady" />;
  const [{ id }, { pilot }] = await Promise.all([params, searchParams]);
  const event = await fetchEventForPage(id);
  if (!event) notFound();
  return <BoardApp eventId={event.id} pilot={pilot === "1"} />;
}

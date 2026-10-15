import { BoardApp } from "@/components/board/BoardApp";
import { PinForm } from "@/components/PinForm";
import { isAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tablica – Familiada" };

export default async function TablicaPage({ searchParams }: { searchParams: Promise<{ pilot?: string }> }) {
  if (!(await isAdmin())) return <PinForm title="Tablica Familiady" />;
  const { pilot } = await searchParams;
  return <BoardApp pilot={pilot === "1"} />;
}

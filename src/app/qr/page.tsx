import { PinForm } from "@/components/PinForm";
import { QrScreen } from "@/components/QrScreen";
import { isAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kod QR – Familiada" };

export default async function QrPage() {
  if (!(await isAdmin())) return <PinForm title="Kod QR" />;
  return <QrScreen baseUrl={process.env.NEXT_PUBLIC_BASE_URL || null} />;
}

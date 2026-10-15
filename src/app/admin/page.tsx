import { AdminApp } from "@/components/admin/AdminApp";
import { PinForm } from "@/components/PinForm";
import { isAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel prowadzącego – Familiada" };

export default async function AdminPage() {
  if (!(await isAdmin())) return <PinForm title="Panel prowadzącego" />;
  return <AdminApp />;
}

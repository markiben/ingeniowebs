import { redirect } from "next/navigation";
import ClientsTable from "@/components/platform/ClientsTable";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import { getDashboardData } from "@/lib/platform/actions";

export default async function PlatformClientsPage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  return (
    <PlatformAppShell requireAdmin>
      <ClientsTable clients={data.clients} projects={data.projects} />
    </PlatformAppShell>
  );
}

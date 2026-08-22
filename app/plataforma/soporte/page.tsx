import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import SupportTicketManager from "@/components/platform/SupportTicketManager";
import { getDashboardData } from "@/lib/platform/actions";

export default async function PlatformSupportPage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  return (
    <PlatformAppShell requireAdmin>
      <PlatformSectionHero
        title="Soporte"
        subtitle="Tickets de mantenimiento y pedidos de clientes con plan activo."
      />
      <SupportTicketManager
        tickets={data.supportTickets}
        projects={data.projects}
      />
    </PlatformAppShell>
  );
}

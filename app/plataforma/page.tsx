import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import ClientProjectView from "@/components/platform/ClientProjectView";
import AdminDashboard from "@/components/platform/AdminDashboard";
import { getDashboardData } from "@/lib/platform/actions";

export default async function PlatformHomePage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");

  const {
    session,
    project,
    clientQuote,
    projects,
    leads,
    messages,
    clients,
    proposals,
    supportTickets,
    acquisitionSpends,
    liveChats,
    quotes,
  } = data;

  return (
    <PlatformAppShell>
      {session.role === "admin" ? (
        <AdminDashboard
          name={session.name}
          quotes={quotes}
          projects={projects}
          clients={clients}
          leads={leads}
          messages={messages}
          liveChats={liveChats}
          proposals={proposals}
          tickets={supportTickets}
          spends={acquisitionSpends}
        />
      ) : (
        <>
          <PlatformSectionHero
            title={`Hola, ${session.name}`}
            subtitle="Estado, pagos y gestiones de tu proyecto"
          />
          {project ? (
            <ClientProjectView project={project} quote={clientQuote} />
          ) : (
            <div className="plat-card plat-quote-panel">
              <p>No encontramos un proyecto activo asociado a tu cuenta.</p>
            </div>
          )}
        </>
      )}
    </PlatformAppShell>
  );
}

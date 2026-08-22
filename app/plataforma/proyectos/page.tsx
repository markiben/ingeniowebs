import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import ProjectsBoard from "@/components/platform/ProjectsBoard";
import { getDashboardData } from "@/lib/platform/actions";

type Props = {
  searchParams: Promise<{ codigo?: string }>;
};

export default async function PlatformProjectsPage({ searchParams }: Props) {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  const { codigo = "" } = await searchParams;

  return (
    <PlatformAppShell requireAdmin>
      <ProjectsBoard
        projects={data.projects}
        quotes={data.quotes}
        clients={data.clients}
        focusCode={codigo}
      />
    </PlatformAppShell>
  );
}

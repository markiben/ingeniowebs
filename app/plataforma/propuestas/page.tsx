import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import ProposalManager from "@/components/platform/ProposalManager";
import { getDashboardData } from "@/lib/platform/actions";

export default async function PlatformProposalsPage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  return (
    <PlatformAppShell requireAdmin>
      <PlatformSectionHero
        title="Propuestas"
        subtitle="Seguí enviadas vs. aprobadas y la tasa de conversión comercial."
      />
      <ProposalManager proposals={data.proposals} />
    </PlatformAppShell>
  );
}

import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import SalesManager from "@/components/platform/SalesManager";
import { getDashboardData } from "@/lib/platform/actions";

export default async function PlatformSalesPage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  return (
    <PlatformAppShell requireAdmin>
      <PlatformSectionHero
        title="Ventas / CAC"
        subtitle="Registrá gastos de adquisición para calcular el costo por cliente nuevo."
      />
      <SalesManager spends={data.acquisitionSpends} />
    </PlatformAppShell>
  );
}

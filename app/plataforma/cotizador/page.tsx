import { Suspense } from "react";
import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import QuoteBuilder from "@/components/platform/QuoteBuilder";
import { getDashboardData } from "@/lib/platform/actions";

export default async function PlatformQuotePage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  return (
    <PlatformAppShell requireAdmin>
      <Suspense fallback={<div className="plat-card">Cargando cotizador…</div>}>
        <QuoteBuilder
          subscribers={data.newsletterSubscribers}
          quotes={data.quotes}
          projects={data.projects}
          clients={data.clients}
        />
      </Suspense>
    </PlatformAppShell>
  );
}

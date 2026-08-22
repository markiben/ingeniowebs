import { Suspense } from "react";
import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import InboxCenter from "@/components/platform/InboxCenter";
import { getDashboardData } from "@/lib/platform/actions";

export default async function PlatformInboxPage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  return (
    <PlatformAppShell requireAdmin>
      <Suspense fallback={<div className="plat-card">Cargando inbox...</div>}>
        <InboxCenter
          messages={data.messages}
          liveChats={data.liveChats}
          leads={data.leads}
          liveChatBotMode={data.liveChatBotMode}
          operator={{
            name: data.session.name,
            avatarUrl: data.session.avatarUrl,
          }}
        />
      </Suspense>
    </PlatformAppShell>
  );
}

import { redirect } from "next/navigation";
import PlatformShell from "@/components/platform/PlatformShell";
import { getDashboardData } from "@/lib/platform/actions";
import { buildPlatformNotifications } from "@/lib/platform/notifications";

export default async function PlatformAppShell({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (requireAdmin && data.session.role !== "admin") redirect("/plataforma");

  const notifications =
    data.session.role === "admin"
      ? buildPlatformNotifications({
          leads: data.leads,
          messages: data.messages,
          liveChats: data.liveChats,
          clients: data.clients,
          notificationStates: data.notificationStates,
        })
      : [];

  return (
    <PlatformShell
      user={data.session}
      notifications={notifications}
      showNotifications={data.session.role === "admin"}
    >
      {children}
    </PlatformShell>
  );
}

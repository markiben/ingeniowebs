import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import ProfileHub from "@/components/platform/ProfileHub";
import { getDashboardData } from "@/lib/platform/actions";
import { readDb } from "@/lib/platform/store";

export default async function PlatformProfilePage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");

  const user = readDb().users.find((entry) => entry.id === data.session.id);
  if (!user) redirect("/plataforma/login");

  return (
    <PlatformAppShell>
      <PlatformSectionHero
        title="Perfil"
        subtitle="Tu cuenta, datos personales y seguridad."
      />
      <ProfileHub
        defaultValues={{
          name: user.name,
          country: user.country,
          phone: user.phone ?? "",
          company: user.company ?? "",
          email: user.email,
          avatarUrl: user.avatarUrl ?? null,
          role: user.role,
          hasPassword: Boolean(user.passwordHash),
        }}
      />
    </PlatformAppShell>
  );
}

import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import NewsletterPanel from "@/components/platform/NewsletterPanel";
import { getDashboardData } from "@/lib/platform/actions";
import { syncNewsletterFromSources } from "@/lib/platform/newsletter";
import { updateDb, readDb } from "@/lib/platform/store";

export default async function PlatformNewsletterPage() {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  updateDb((db) => {
    syncNewsletterFromSources(db);
    if (!Array.isArray(db.newsletterClicks)) {
      db.newsletterClicks = [];
    }
  });

  const db = readDb();
  const subscribers = [...db.newsletterSubscribers].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const clicks = [...(db.newsletterClicks ?? [])];

  return (
    <PlatformAppShell requireAdmin>
      <NewsletterPanel subscribers={subscribers} clicks={clicks} />
    </PlatformAppShell>
  );
}

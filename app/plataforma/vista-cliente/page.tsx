import Link from "next/link";
import { redirect } from "next/navigation";
import PlatformAppShell from "@/components/platform/PlatformAppShell";
import PlatformSectionHero from "@/components/platform/PlatformSectionHero";
import ClientProjectView from "@/components/platform/ClientProjectView";
import { getDashboardData } from "@/lib/platform/actions";

type Props = {
  searchParams: Promise<{ proyecto?: string }>;
};

export default async function ClientVistaPreviewPage({ searchParams }: Props) {
  const data = await getDashboardData();
  if (!data) redirect("/plataforma/login");
  if (data.session.role !== "admin") redirect("/plataforma");

  const { proyecto = "" } = await searchParams;
  const project =
    data.projects.find((entry) => entry.id === proyecto) ??
    data.projects.find(
      (entry) =>
        entry.status !== "completed" && entry.status !== "cancelled",
    ) ??
    data.projects[0] ??
    null;

  const quote = project?.quoteId
    ? data.quotes.find((entry) => entry.id === project.quoteId) ?? null
    : null;

  return (
    <PlatformAppShell requireAdmin>
      <PlatformSectionHero
        title="Vista del cliente"
        subtitle="Previsualizá el hub de proyecto tal como lo ve el cliente en Mi proyecto."
        actions={
          <Link href="/plataforma/proyectos" className="plat-btn is-ghost">
            Volver a proyectos
          </Link>
        }
      />

      {!project ? (
        <div className="plat-card plat-quote-panel">
          <p>
            No hay proyectos todavía. Aprobá una cotización para crear el
            primero y después abrí esta vista.
          </p>
        </div>
      ) : (
        <>
          <div className="plat-client-preview-picker plat-card plat-quote-panel">
            <label htmlFor="vista-proyecto">Proyecto</label>
            <form method="get" className="plat-client-preview-form">
              <select
                id="vista-proyecto"
                name="proyecto"
                defaultValue={project.id}
              >
                {data.projects.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.code} · {entry.clientName} · {entry.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="plat-btn is-primary is-compact">
                Ver
              </button>
            </form>
          </div>
          <ClientProjectView project={project} quote={quote} preview />
        </>
      )}
    </PlatformAppShell>
  );
}

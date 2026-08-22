import type {
  PlatformProject,
  PlatformQuote,
  PlatformUser,
  ProjectStatus,
} from "./types";
import { PROJECT_STATUS_LABELS } from "./project-status";

export type ProjectFlowStepId =
  | "quoted"
  | "approved"
  | "invited"
  | "registered"
  | "delivery"
  | "done";

export type ProjectFlowStep = {
  id: ProjectFlowStepId;
  label: string;
  done: boolean;
  current: boolean;
};

/** Cliente registrado vinculado al proyecto. */
export function findClientForProject(
  project: PlatformProject,
  clients: PlatformUser[],
) {
  const byProject = clients.find(
    (user) => user.role === "client" && user.projectId === project.id,
  );
  if (byProject) return byProject;

  const email = project.clientEmail.trim().toLowerCase();
  if (!email) return null;
  return (
    clients.find(
      (user) => user.role === "client" && user.email.toLowerCase() === email,
    ) ?? null
  );
}

export function isClientRegistered(
  project: PlatformProject,
  clients: PlatformUser[],
) {
  return Boolean(findClientForProject(project, clients));
}

export function projectFlowSteps(input: {
  quote?: PlatformQuote | null;
  project: PlatformProject;
  registered: boolean;
}): ProjectFlowStep[] {
  const { quote, project, registered } = input;
  const approved = Boolean(
    quote?.status === "approved" || project.quoteId || project.quoteCode,
  );
  const delivery =
    project.progress > 0 ||
    project.status === "in_progress" ||
    project.status === "review";
  const done =
    project.status === "completed" || project.status === "cancelled";

  const steps: Omit<ProjectFlowStep, "current">[] = [
    {
      id: "quoted",
      label: "Cotización",
      done: Boolean(quote) || Boolean(project.quoteCode),
    },
    {
      id: "approved",
      label: "Aprobada",
      done: approved,
    },
    {
      id: "invited",
      label: "Invitación",
      done: approved,
    },
    {
      id: "registered",
      label: "Cliente registrado",
      done: registered,
    },
    {
      id: "delivery",
      label: "En curso",
      done: delivery || done,
    },
    {
      id: "done",
      label: project.status === "cancelled" ? "Cancelado" : "Entregado",
      done: done,
    },
  ];

  let currentIndex = steps.findIndex((step) => !step.done);
  if (currentIndex < 0) currentIndex = steps.length - 1;

  return steps.map((step, index) => ({
    ...step,
    current: index === currentIndex,
  }));
}

export function clientStatusLabel(status: ProjectStatus) {
  return PROJECT_STATUS_LABELS[status] ?? status;
}

export function clientStatusHint(status: ProjectStatus) {
  switch (status) {
    case "in_progress":
      return "Estamos trabajando en tu proyecto. El avance se actualiza según las horas invertidas.";
    case "review":
      return "Hay entregables listos para tu revisión.";
    case "completed":
      return "Proyecto entregado. Gracias por confiar en Ingenio Webs.";
    case "cancelled":
      return "Este proyecto fue cancelado.";
    default:
      return "";
  }
}

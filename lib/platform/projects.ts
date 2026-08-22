import { createId, readDb, updateDb } from "./store";
import { expectedAmountPaid } from "./quote-commerce";
import type {
  PricingType,
  PlatformProject,
  ProjectPaymentStatus,
  ProjectService,
  ProjectStatus,
} from "./types";

export {
  PROJECT_STATUS_LABELS,
  isProjectStatus,
  normalizeProjectStatus,
} from "./project-status";

export function generateProjectCode(date = new Date()) {
  const year = date.getFullYear();
  const db = readDb();
  const prefix = `IW-${year}-`;
  const sameYear = db.projects
    .map((project) => project.code)
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));

  const next = (sameYear.length ? Math.max(...sameYear) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function createProject(input: {
  name: string;
  clientName: string;
  clientEmail: string;
  value: number;
  currency?: "ARS" | "USD";
  description?: string;
  pricingType?: PricingType;
  hoursEstimated?: number;
  hoursInvested?: number;
  hourlyCost?: number;
  maintenancePlan?: boolean;
  quoteId?: string | null;
  quoteCode?: string | null;
}): PlatformProject {
  const now = new Date().toISOString();
  const project: PlatformProject = {
    id: createId("proj"),
    code: generateProjectCode(),
    name: input.name.trim(),
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim().toLowerCase(),
    value: Number(input.value) || 0,
    currency: input.currency ?? "USD",
    status: "in_progress",
    progress: 0,
    description: input.description?.trim() ?? "",
    pricingType: input.pricingType ?? "fixed",
    hoursEstimated: Number(input.hoursEstimated) || 0,
    hoursInvested: Number(input.hoursInvested) || 0,
    hourlyCost: Number(input.hourlyCost) || 0,
    maintenancePlan: Boolean(input.maintenancePlan),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    accessEnabled: true,
    quoteId: input.quoteId ?? null,
    quoteCode: input.quoteCode ?? null,
    services: [],
    paymentStatus: "unpaid",
    amountPaid: null,
    clientUpdates: [],
    cancelRequest: null,
  };

  updateDb((db) => {
    db.projects.unshift(project);
  });

  return project;
}

export function getProjectById(projectId: string) {
  return readDb().projects.find((entry) => entry.id === projectId) ?? null;
}

export function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  progress?: number,
) {
  return updateDb((db) => {
    const project = db.projects.find((entry) => entry.id === projectId);
    if (!project) return;

    project.status = status;
    project.updatedAt = new Date().toISOString();
    if (typeof progress === "number") {
      project.progress = Math.max(0, Math.min(100, progress));
    }

    if (status === "completed") {
      project.completedAt = new Date().toISOString();
      project.progress = 100;
      project.accessEnabled = false;
    } else if (status === "cancelled") {
      project.accessEnabled = false;
    } else {
      project.accessEnabled = true;
      project.completedAt = null;
    }
  });
}

export function progressFromHours(
  hoursInvested: number,
  hoursEstimated: number,
  status?: ProjectStatus,
) {
  if (status === "completed") return 100;
  const estimated = Math.max(0, hoursEstimated);
  if (estimated <= 0) return 0;
  const invested = Math.max(0, hoursInvested);
  return Math.max(0, Math.min(100, Math.round((invested / estimated) * 100)));
}

export function syncProjectProgressFromHours(project: PlatformProject) {
  if (project.status === "completed") {
    project.progress = 100;
    return;
  }
  if (project.status === "cancelled") return;
  project.progress = progressFromHours(
    project.hoursInvested || 0,
    project.hoursEstimated || 0,
    project.status,
  );
}

export function updateProjectProgressAndStatus(
  projectId: string,
  input: {
    progress?: number;
    status?: ProjectStatus;
    hoursInvested?: number;
  },
) {
  return updateDb((db) => {
    const project = db.projects.find((entry) => entry.id === projectId);
    if (!project) return;

    if (typeof input.hoursInvested === "number") {
      project.hoursInvested = Math.max(0, input.hoursInvested);
    }
    if (input.status) {
      project.status = input.status;
      if (input.status === "completed") {
        project.completedAt = new Date().toISOString();
        project.progress = 100;
        project.accessEnabled = false;
      } else if (input.status === "cancelled") {
        project.accessEnabled = false;
      } else {
        project.accessEnabled = true;
        project.completedAt = null;
      }
    }

    if (project.status === "completed") {
      project.progress = 100;
    } else if (typeof input.hoursInvested === "number" || !input.progress) {
      syncProjectProgressFromHours(project);
    } else if (typeof input.progress === "number") {
      project.progress = Math.max(0, Math.min(100, Math.round(input.progress)));
    }

    project.updatedAt = new Date().toISOString();
  });
}

export function updateProjectPaymentStatus(
  projectId: string,
  paymentStatus: ProjectPaymentStatus,
  amountPaidOverride?: number,
) {
  return updateDb((db) => {
    const project = db.projects.find((entry) => entry.id === projectId);
    if (!project) return;

    project.paymentStatus = paymentStatus;

    if (paymentStatus === "unpaid") {
      project.amountPaid = 0;
    } else if (
      typeof amountPaidOverride === "number" &&
      Number.isFinite(amountPaidOverride)
    ) {
      project.amountPaid = Math.max(0, amountPaidOverride);
    } else if (!(Number(project.amountPaid) > 0)) {
      const quote = project.quoteId
        ? (db.quotes ?? []).find((entry) => entry.id === project.quoteId)
        : null;
      if (quote) {
        project.amountPaid =
          paymentStatus === "paid_in_full"
            ? Math.max(0, Number(quote.total) || 0)
            : expectedAmountPaid({
                total: quote.total,
                paymentSchedule: quote.paymentSchedule,
              });
      } else {
        project.amountPaid =
          paymentStatus === "paid_in_full"
            ? Math.max(0, Number(project.value) || 0)
            : Math.round((Number(project.value) || 0) * 0.5 * 100) / 100;
      }
    }

    project.updatedAt = new Date().toISOString();
  });
}

export function addProjectService(
  projectId: string,
  input: {
    name: string;
    description?: string;
    hours?: number;
    amount?: number;
  },
): ProjectService | null {
  const name = input.name.trim();
  if (!name) return null;

  const service: ProjectService = {
    id: createId("psvc"),
    name,
    description: input.description?.trim() ?? "",
    hours: Math.max(0, Number(input.hours) || 0),
    amount: Math.max(0, Number(input.amount) || 0),
    createdAt: new Date().toISOString(),
  };

  let saved: ProjectService | null = null;
  updateDb((db) => {
    const project = db.projects.find((entry) => entry.id === projectId);
    if (!project) return;
    if (!Array.isArray(project.services)) project.services = [];
    project.services.push(service);
    project.hoursEstimated =
      (Number(project.hoursEstimated) || 0) + service.hours;
    project.value = (Number(project.value) || 0) + service.amount;
    syncProjectProgressFromHours(project);
    project.updatedAt = new Date().toISOString();
    saved = service;
  });

  return saved;
}

export function updateProjectHours(
  projectId: string,
  input: {
    hoursEstimated?: number;
    hoursInvested?: number;
    hourlyCost?: number;
    pricingType?: PricingType;
    maintenancePlan?: boolean;
  },
) {
  return updateDb((db) => {
    const project = db.projects.find((entry) => entry.id === projectId);
    if (!project) return;
    if (typeof input.hoursEstimated === "number") {
      project.hoursEstimated = Math.max(0, input.hoursEstimated);
    }
    if (typeof input.hoursInvested === "number") {
      project.hoursInvested = Math.max(0, input.hoursInvested);
    }
    if (typeof input.hourlyCost === "number") {
      project.hourlyCost = Math.max(0, input.hourlyCost);
    }
    if (input.pricingType) project.pricingType = input.pricingType;
    if (typeof input.maintenancePlan === "boolean") {
      project.maintenancePlan = input.maintenancePlan;
    }
    syncProjectProgressFromHours(project);
    project.updatedAt = new Date().toISOString();
  });
}

export function projectHoursDelta(project: PlatformProject) {
  return (project.hoursInvested || 0) - (project.hoursEstimated || 0);
}

export function projectCostOverrun(project: PlatformProject) {
  const delta = Math.max(0, projectHoursDelta(project));
  return delta * (project.hourlyCost || 0);
}

export function getMetrics() {
  const db = readDb();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const active = db.projects.filter(
    (project) =>
      project.accessEnabled &&
      project.status !== "completed" &&
      project.status !== "cancelled",
  );
  const completed = db.projects.filter(
    (project) => project.status === "completed",
  );
  const monthly = db.projects.filter((project) => {
    const created = new Date(project.createdAt);
    return created.getMonth() === month && created.getFullYear() === year;
  });

  const totalValue = db.projects.reduce(
    (sum, project) => sum + (project.value || 0),
    0,
  );
  const monthlyValue = monthly.reduce(
    (sum, project) => sum + (project.value || 0),
    0,
  );
  const unreadLeads = db.leads.filter((lead) => !lead.read).length;
  const unreadMessages = db.messages.filter((message) => !message.read).length;

  return {
    totalProjects: db.projects.length,
    activeProjects: active.length,
    completedProjects: completed.length,
    monthlyProjects: monthly.length,
    totalValue,
    monthlyValue,
    clients: db.users.filter((user) => user.role === "client").length,
    unreadLeads,
    unreadMessages,
  };
}

import type {
  PlatformLead,
  PlatformMessage,
  PlatformProject,
  PlatformUser,
} from "./types";
import { normalizeProjectStatus } from "./project-status";

function projectHoursDelta(project: PlatformProject) {
  return (project.hoursInvested || 0) - (project.hoursEstimated || 0);
}

function projectCostOverrun(project: PlatformProject) {
  const delta = Math.max(0, projectHoursDelta(project));
  return delta * (project.hourlyCost || 0);
}

export type AnalyticsRange = "general" | "year" | "month" | "day";

export type AnalyticsFilter = {
  range: AnalyticsRange;
  year: number;
  month: number; // 0-11
  day: number; // 1-31
};

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function inRange(dateStr: string, filter: AnalyticsFilter) {
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) return false;
  if (filter.range === "general") return true;
  if (filter.range === "year") return date.getFullYear() === filter.year;
  if (filter.range === "month") {
    return date.getFullYear() === filter.year && date.getMonth() === filter.month;
  }
  return (
    date.getFullYear() === filter.year &&
    date.getMonth() === filter.month &&
    date.getDate() === filter.day
  );
}

export function filterProjects(
  projects: PlatformProject[],
  filter: AnalyticsFilter,
) {
  return projects.filter((project) => inRange(project.createdAt, filter));
}

function sumByCurrency(
  projects: PlatformProject[],
  currency: PlatformProject["currency"],
) {
  return projects
    .filter((project) => project.currency === currency)
    .reduce((sum, project) => sum + (project.value || 0), 0);
}

function sumRefundByCurrency(
  projects: PlatformProject[],
  currency: PlatformProject["currency"],
) {
  return projects
    .filter((project) => project.currency === currency)
    .reduce((sum, project) => sum + (Number(project.refundAmount) || 0), 0);
}

function projectNetValue(project: PlatformProject) {
  return Math.max(0, (project.value || 0) - (Number(project.refundAmount) || 0));
}

function averageTicket(
  projects: PlatformProject[],
  currency: PlatformProject["currency"],
) {
  const scoped = projects.filter((project) => project.currency === currency);
  if (!scoped.length) return 0;
  return (
    scoped.reduce((sum, project) => sum + projectNetValue(project), 0) /
    scoped.length
  );
}

export function buildAnalytics(
  projects: PlatformProject[],
  leads: PlatformLead[],
  messages: PlatformMessage[],
  clients: PlatformUser[],
  filter: AnalyticsFilter,
) {
  const scopedProjects = filterProjects(projects, filter);
  const scopedLeads = leads.filter((lead) => inRange(lead.createdAt, filter));
  const scopedMessages = messages.filter((message) =>
    inRange(message.createdAt, filter),
  );
  const scopedClients = clients.filter((client) =>
    inRange(client.createdAt, filter),
  );

  const activeProjects = scopedProjects.filter(
    (project) =>
      project.accessEnabled &&
      project.status !== "completed" &&
      project.status !== "cancelled",
  ).length;
  const completedProjects = scopedProjects.filter(
    (project) => project.status === "completed",
  ).length;
  const billedUsd = sumByCurrency(scopedProjects, "USD");
  const billedArs = sumByCurrency(scopedProjects, "ARS");
  const refundedUsd = sumRefundByCurrency(scopedProjects, "USD");
  const refundedArs = sumRefundByCurrency(scopedProjects, "ARS");
  const netUsd = billedUsd - refundedUsd;
  const netArs = billedArs - refundedArs;
  const avgTicketUsd = averageTicket(scopedProjects, "USD");
  const avgTicketArs = averageTicket(scopedProjects, "ARS");
  const totalValue = netUsd + netArs;

  const hoursEstimated = scopedProjects.reduce(
    (sum, project) => sum + (project.hoursEstimated || 0),
    0,
  );
  const hoursInvested = scopedProjects.reduce(
    (sum, project) => sum + (project.hoursInvested || 0),
    0,
  );
  const fixedOverBudget = scopedProjects.filter(
    (project) =>
      project.pricingType === "fixed" &&
      project.hoursEstimated > 0 &&
      project.hoursInvested > project.hoursEstimated,
  );
  const marginAtRiskUsd = fixedOverBudget
    .filter((project) => project.currency === "USD")
    .reduce((sum, project) => sum + projectCostOverrun(project), 0);
  const marginAtRiskArs = fixedOverBudget
    .filter((project) => project.currency === "ARS")
    .reduce((sum, project) => sum + projectCostOverrun(project), 0);

  const leadConversion =
    scopedLeads.length > 0
      ? (scopedClients.length / scopedLeads.length) * 100
      : 0;

  const completedCount = scopedProjects.filter(
    (project) => normalizeProjectStatus(project.status) === "completed",
  ).length;
  const cancelledCount = scopedProjects.filter(
    (project) => normalizeProjectStatus(project.status) === "cancelled",
  ).length;
  const inProgressCount = scopedProjects.filter(
    (project) => normalizeProjectStatus(project.status) === "in_progress",
  ).length;
  const reviewCount = scopedProjects.filter(
    (project) => normalizeProjectStatus(project.status) === "review",
  ).length;
  const statusSeries = [
    { name: "En curso", value: inProgressCount, color: "#7dd3fc" },
    { name: "En revisión", value: reviewCount, color: "#fbbf24" },
    { name: "Finalizados", value: completedCount, color: "#86efac" },
    { name: "Cancelados", value: cancelledCount, color: "#fda4af" },
  ];
  const statusTotal = scopedProjects.length;

  // Both series need the same "projects created in this date bucket" split
  // (per day, per month, or per year depending on the active filter) — the
  // hours chart used to bucket by project instead, which meant it silently
  // dropped anything past the first 8 projects.
  let dateBuckets: { label: string; projects: PlatformProject[] }[] = [];

  if (filter.range === "day") {
    dateBuckets = [
      { label: `${filter.day}/${filter.month + 1}`, projects: scopedProjects },
    ];
  } else if (filter.range === "month") {
    const totalDays = daysInMonth(filter.year, filter.month);
    dateBuckets = Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      return {
        label: String(day),
        projects: scopedProjects.filter((project) => {
          const date = new Date(project.createdAt);
          return date.getDate() === day;
        }),
      };
    });
  } else if (filter.range === "year") {
    dateBuckets = MONTH_LABELS.map((label, month) => ({
      label,
      projects: scopedProjects.filter((project) => {
        const date = new Date(project.createdAt);
        return date.getMonth() === month;
      }),
    }));
  } else {
    const now = new Date();

    // Window starts at the first month that actually has a project, not
    // a flat 12 months back: a young account was rendering eleven empty
    // months to show one bar. Capped at 12 so an old account still gets
    // a readable axis, and never shorter than 3 so a brand-new account
    // still reads as a trend rather than a single floating column.
    // Empty months *inside* the window are kept — a gap in activity is
    // information, and trimming them would distort the time axis.
    const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
    const currentIndex = monthIndex(now);
    const firstProjectIndex = projects.reduce((earliest, project) => {
      const created = new Date(project.createdAt);
      if (!Number.isFinite(created.getTime())) return earliest;
      return Math.min(earliest, monthIndex(created));
    }, currentIndex);

    const span = Math.min(12, Math.max(3, currentIndex - firstProjectIndex + 1));

    dateBuckets = Array.from({ length: span }, (_, offset) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (span - 1) + offset,
        1,
      );
      return {
        label: `${MONTH_LABELS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`,
        projects: scopedProjects.filter((project) => {
          const created = new Date(project.createdAt);
          return (
            created.getFullYear() === date.getFullYear() &&
            created.getMonth() === date.getMonth()
          );
        }),
      };
    });
  }

  const volumeSeries = dateBuckets.map((bucket) => ({
    label: bucket.label,
    proyectos: bucket.projects.length,
    valor: bucket.projects.reduce(
      (sum, project) => sum + projectNetValue(project),
      0,
    ),
  }));

  const hoursSeries = dateBuckets.map((bucket) => ({
    label: bucket.label,
    estimadas: bucket.projects.reduce(
      (sum, project) => sum + (project.hoursEstimated || 0),
      0,
    ),
    invertidas: bucket.projects.reduce(
      (sum, project) => sum + (project.hoursInvested || 0),
      0,
    ),
  }));

  const availableYears = (() => {
    const platformStartYear = 2026;
    const currentYear = new Date().getFullYear();
    const yearsFromData = [
      ...projects.map((project) => new Date(project.createdAt).getFullYear()),
    ].filter((year) => Number.isFinite(year));

    const startYear = yearsFromData.length
      ? Math.min(platformStartYear, ...yearsFromData)
      : platformStartYear;
    const endYear = Math.max(
      currentYear,
      yearsFromData.length ? Math.max(...yearsFromData) : platformStartYear,
    );

    const years: number[] = [];
    for (let year = endYear; year >= startYear; year -= 1) {
      years.push(year);
    }
    return years;
  })();

  return {
    cards: {
      clients: scopedClients.length,
      totalProjects: scopedProjects.length,
      activeProjects,
      completedProjects,
      billedUsd,
      billedArs,
      refundedUsd,
      refundedArs,
      netUsd,
      netArs,
      avgTicketUsd,
      avgTicketArs,
      totalValue,
      leads: scopedLeads.length,
      messages: scopedMessages.length,
      hoursEstimated,
      hoursInvested,
      hoursDelta: hoursInvested - hoursEstimated,
      fixedOverBudget: fixedOverBudget.length,
      marginAtRiskUsd,
      marginAtRiskArs,
      leadConversion,
    },
    statusSeries,
    statusTotal,
    volumeSeries,
    hoursSeries,
    availableYears,
    recentProjects: [...scopedProjects].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  };
}

export { MONTH_LABELS };

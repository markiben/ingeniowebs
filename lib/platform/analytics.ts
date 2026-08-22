import type {
  PlatformAcquisitionSpend,
  PlatformLead,
  PlatformMessage,
  PlatformProject,
  PlatformProposal,
  PlatformSupportTicket,
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

function sumSpend(
  spends: PlatformAcquisitionSpend[],
  currency: PlatformAcquisitionSpend["currency"],
) {
  return spends
    .filter((spend) => spend.currency === currency)
    .reduce((sum, spend) => sum + (spend.amount || 0), 0);
}

export function buildAnalytics(
  projects: PlatformProject[],
  leads: PlatformLead[],
  messages: PlatformMessage[],
  clients: PlatformUser[],
  proposals: PlatformProposal[],
  tickets: PlatformSupportTicket[],
  spends: PlatformAcquisitionSpend[],
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
  const scopedProposals = proposals.filter((proposal) =>
    inRange(proposal.createdAt, filter),
  );
  const scopedTickets = tickets.filter((ticket) =>
    inRange(ticket.createdAt, filter),
  );
  const scopedSpends = spends.filter((spend) => inRange(spend.spentAt, filter));

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

  const proposalsSent = scopedProposals.filter(
    (proposal) =>
      proposal.status === "sent" ||
      proposal.status === "approved" ||
      proposal.status === "rejected" ||
      proposal.status === "expired",
  ).length;
  const proposalsApproved = scopedProposals.filter(
    (proposal) => proposal.status === "approved",
  ).length;
  const proposalConversion =
    proposalsSent > 0 ? (proposalsApproved / proposalsSent) * 100 : 0;
  const leadConversion =
    scopedLeads.length > 0
      ? (scopedClients.length / scopedLeads.length) * 100
      : 0;

  const activeTickets = scopedTickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress",
  ).length;

  const spendUsd = sumSpend(scopedSpends, "USD");
  const spendArs = sumSpend(scopedSpends, "ARS");
  const newCustomers = scopedClients.length;
  const cacUsd = newCustomers > 0 ? spendUsd / newCustomers : 0;
  const cacArs = newCustomers > 0 ? spendArs / newCustomers : 0;

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

  const hoursSeries = scopedProjects
    .filter(
      (project) => project.hoursEstimated > 0 || project.hoursInvested > 0,
    )
    .slice(0, 8)
    .map((project) => ({
      label: project.code,
      estimadas: project.hoursEstimated,
      invertidas: project.hoursInvested,
      delta: projectHoursDelta(project),
    }));

  let volumeSeries: { label: string; proyectos: number; valor: number }[] = [];

  if (filter.range === "day") {
    volumeSeries = [
      {
        label: `${filter.day}/${filter.month + 1}`,
        proyectos: scopedProjects.length,
        valor: scopedProjects.reduce(
          (sum, project) => sum + projectNetValue(project),
          0,
        ),
      },
    ];
  } else if (filter.range === "month") {
    const totalDays = daysInMonth(filter.year, filter.month);
    volumeSeries = Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const dayProjects = scopedProjects.filter((project) => {
        const date = new Date(project.createdAt);
        return date.getDate() === day;
      });
      return {
        label: String(day),
        proyectos: dayProjects.length,
        valor: dayProjects.reduce(
          (sum, project) => sum + projectNetValue(project),
          0,
        ),
      };
    });
  } else if (filter.range === "year") {
    volumeSeries = MONTH_LABELS.map((label, month) => {
      const monthProjects = scopedProjects.filter((project) => {
        const date = new Date(project.createdAt);
        return date.getMonth() === month;
      });
      return {
        label,
        proyectos: monthProjects.length,
        valor: monthProjects.reduce(
          (sum, project) => sum + projectNetValue(project),
          0,
        ),
      };
    });
  } else {
    const now = new Date();
    volumeSeries = Array.from({ length: 12 }, (_, offset) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + offset, 1);
      const monthProjects = projects.filter((project) => {
        const created = new Date(project.createdAt);
        return (
          created.getFullYear() === date.getFullYear() &&
          created.getMonth() === date.getMonth()
        );
      });
      return {
        label: `${MONTH_LABELS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`,
        proyectos: monthProjects.length,
        valor: monthProjects.reduce(
          (sum, project) => sum + projectNetValue(project),
          0,
        ),
      };
    });
  }

  const availableYears = Array.from(
    new Set(
      [
        ...projects.map((project) => new Date(project.createdAt).getFullYear()),
        ...proposals.map((proposal) =>
          new Date(proposal.createdAt).getFullYear(),
        ),
        ...spends.map((spend) => new Date(spend.spentAt).getFullYear()),
      ].filter((year) => Number.isFinite(year)),
    ),
  ).sort((a, b) => b - a);

  if (!availableYears.length) {
    availableYears.push(new Date().getFullYear());
  }

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
      proposalsSent,
      proposalsApproved,
      proposalConversion,
      leadConversion,
      activeTickets,
      spendUsd,
      spendArs,
      cacUsd,
      cacArs,
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

import { inboxPath } from "./inbox";
import { isLiveChatUnreadForAdmin } from "./live-chat-utils";
import { isClientRegistered } from "./project-flow";
import { normalizeProjectStatus } from "./project-status";
import type {
  LiveChatSession,
  PlatformLead,
  PlatformMessage,
  PlatformProject,
  PlatformQuote,
  PlatformUser,
} from "./types";

export type DashboardAttentionItem = {
  id: string;
  tone: "urgent" | "warn" | "info";
  title: string;
  detail: string;
  href: string;
  when: string;
};

export type DashboardPipeline = {
  quotesSent: number;
  quotesApproved: number;
  inProgress: number;
  inReview: number;
  completed: number;
  pendingRegister: number;
};

export type DashboardAttentionCounts = {
  inbox: number;
  forms: number;
  messages: number;
  chats: number;
  quotesSent: number;
  inReview: number;
  pendingRegister: number;
  blocked: number;
  total: number;
};

export type DashboardRecentItem = {
  id: string;
  kind: "quote" | "project" | "inbox";
  title: string;
  meta: string;
  href: string;
  when: string;
};

function parseTime(value: string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(value: string | null | undefined) {
  const time = parseTime(value);
  if (!time) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24)));
}

export function buildDashboardOps(input: {
  quotes: PlatformQuote[];
  projects: PlatformProject[];
  clients: PlatformUser[];
  leads: PlatformLead[];
  messages: PlatformMessage[];
  liveChats: LiveChatSession[];
}) {
  const { quotes, projects, clients, leads, messages, liveChats } = input;

  const forms = leads.filter((lead) => !lead.read);
  const unreadMessages = messages.filter((message) => !message.read);
  const waitingChats = liveChats.filter(
    (chat) => chat.status !== "closed" && isLiveChatUnreadForAdmin(chat),
  );
  const quotesSent = quotes.filter((quote) => quote.status === "sent");
  const quotesApproved = quotes.filter((quote) => quote.status === "approved");

  const normalizedProjects = projects.map((project) => ({
    ...project,
    status: normalizeProjectStatus(project.status),
  }));

  const inProgress = normalizedProjects.filter(
    (project) => project.status === "in_progress",
  );
  const inReview = normalizedProjects.filter(
    (project) => project.status === "review",
  );
  const completed = normalizedProjects.filter(
    (project) => project.status === "completed",
  );
  const openProjects = normalizedProjects.filter(
    (project) =>
      project.status !== "completed" && project.status !== "cancelled",
  );
  const pendingRegister = openProjects.filter(
    (project) => !isClientRegistered(project, clients),
  );
  const blocked = clients.filter(
    (client) => client.role === "client" && Boolean(client.accessBlocked),
  );

  const counts: DashboardAttentionCounts = {
    forms: forms.length,
    messages: unreadMessages.length,
    chats: waitingChats.length,
    inbox: forms.length + unreadMessages.length + waitingChats.length,
    quotesSent: quotesSent.length,
    inReview: inReview.length,
    pendingRegister: pendingRegister.length,
    blocked: blocked.length,
    total:
      forms.length +
      unreadMessages.length +
      waitingChats.length +
      quotesSent.length +
      inReview.length +
      pendingRegister.length +
      blocked.length,
  };

  const pipeline: DashboardPipeline = {
    quotesSent: quotesSent.length,
    quotesApproved: quotesApproved.length,
    inProgress: inProgress.length,
    inReview: inReview.length,
    completed: completed.length,
    pendingRegister: pendingRegister.length,
  };

  const attention: DashboardAttentionItem[] = [];

  for (const chat of waitingChats.slice(0, 4)) {
    attention.push({
      id: `chat-${chat.id}`,
      tone: "urgent",
      title: chat.name || chat.email || "Chat web",
      detail: "Esperando respuesta en Inbox",
      href: inboxPath("chat", chat.id),
      when: formatWhen(chat.updatedAt),
    });
  }

  for (const message of unreadMessages.slice(0, 3)) {
    attention.push({
      id: `msg-${message.id}`,
      tone: "urgent",
      title: message.name || message.email || "Mensaje",
      detail: "Mensaje sin leer",
      href: inboxPath("mensajes", message.id),
      when: formatWhen(message.createdAt),
    });
  }

  for (const lead of forms.slice(0, 3)) {
    attention.push({
      id: `lead-${lead.id}`,
      tone: "warn",
      title: lead.name || lead.email,
      detail: "Formulario nuevo",
      href: inboxPath("formularios", lead.id),
      when: formatWhen(lead.createdAt),
    });
  }

  for (const quote of [...quotesSent]
    .sort((a, b) => parseTime(b.updatedAt) - parseTime(a.updatedAt))
    .slice(0, 5)) {
    const days = daysSince(quote.updatedAt || quote.createdAt);
    attention.push({
      id: `quote-${quote.id}`,
      tone: days >= 5 ? "warn" : "info",
      title: `${quote.code} · ${quote.clientName}`,
      detail:
        days > 0
          ? `Cotización enviada · ${days}d sin respuesta`
          : "Cotización enviada, esperando respuesta",
      href: `/plataforma/cotizador`,
      when: formatWhen(quote.updatedAt || quote.createdAt),
    });
  }

  for (const project of [...inReview]
    .sort((a, b) => parseTime(b.updatedAt) - parseTime(a.updatedAt))
    .slice(0, 5)) {
    attention.push({
      id: `review-${project.id}`,
      tone: "warn",
      title: `${project.code} · ${project.name}`,
      detail: "Proyecto en revisión",
      href: `/plataforma/proyectos`,
      when: formatWhen(project.updatedAt),
    });
  }

  for (const project of [...pendingRegister]
    .sort((a, b) => parseTime(b.updatedAt) - parseTime(a.updatedAt))
    .slice(0, 4)) {
    attention.push({
      id: `reg-${project.id}`,
      tone: "info",
      title: `${project.code} · ${project.clientName}`,
      detail: "Cliente aún no se registró en la plataforma",
      href: `/plataforma/clientes`,
      when: formatWhen(project.updatedAt),
    });
  }

  for (const client of blocked.slice(0, 3)) {
    attention.push({
      id: `block-${client.id}`,
      tone: "warn",
      title: client.name || client.email,
      detail: "Acceso bloqueado",
      href: `/plataforma/clientes`,
      when: formatWhen(client.updatedAt),
    });
  }

  attention.sort((a, b) => {
    const rank = { urgent: 0, warn: 1, info: 2 } as const;
    return rank[a.tone] - rank[b.tone];
  });

  const recent: DashboardRecentItem[] = [];

  for (const quote of quotes) {
    recent.push({
      id: `rq-${quote.id}`,
      kind: "quote",
      title: `${quote.code} · ${quote.clientName}`,
      meta:
        quote.status === "sent"
          ? "Cotización enviada"
          : quote.status === "approved"
            ? "Cotización aprobada"
            : quote.status === "rejected"
              ? "Cotización rechazada"
              : `Cotización · ${quote.status}`,
      href: `/plataforma/cotizador`,
      when: quote.updatedAt || quote.createdAt,
    });
  }

  for (const project of normalizedProjects) {
    const statusLabel =
      project.status === "in_progress"
        ? "En curso"
        : project.status === "review"
          ? "En revisión"
          : project.status === "completed"
            ? "Finalizado"
            : "Cancelado";
    recent.push({
      id: `rp-${project.id}`,
      kind: "project",
      title: `${project.code} · ${project.name}`,
      meta: `${statusLabel} · ${project.clientName}`,
      href: `/plataforma/proyectos`,
      when: project.updatedAt || project.createdAt,
    });
  }

  recent.sort((a, b) => parseTime(b.when) - parseTime(a.when));

  return {
    counts,
    pipeline,
    attention: attention.slice(0, 12),
    recent: recent.slice(0, 10).map((item) => ({
      ...item,
      when: formatWhen(item.when),
    })),
  };
}
